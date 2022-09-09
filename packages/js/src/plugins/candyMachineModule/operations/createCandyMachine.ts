import { Metaplex } from '@/Metaplex';
import {
  findCollectionAuthorityRecordPda,
  findMasterEditionV2Pda,
  findMetadataPda,
} from '@/plugins/nftModule';
import {
  BigNumber,
  Creator,
  Operation,
  OperationHandler,
  Program,
  PublicKey,
  Signer,
  toBigNumber,
} from '@/types';
import { DisposableScope, TransactionBuilder } from '@/utils';
import { createInitializeInstruction } from '@metaplex-foundation/mpl-candy-machine-core';
import { ConfirmOptions, Keypair } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { CandyGuardsSettings, DefaultCandyGuardSettings } from '../guards';
import {
  CandyMachine,
  CandyMachineConfigLineSettings,
  CandyMachineHiddenSettings,
  toCandyMachineData,
} from '../models';
import { getCandyMachineSize } from '../models/CandyMachineHiddenSection';
import { findCandyMachineAuthorityPda } from '../pdas';

// -----------------
// Operation
// -----------------

const Key = 'CreateCandyMachineOperation' as const;

/**
 * TODO
 *
 * ```ts
 * const { candyMachine } = await metaplex
 *   .candyMachines()
 *   .create({
 *   })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const createCandyMachineOperation = <
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
>(
  input: CreateCandyMachineInput<T>
): CreateCandyMachineOperation<T> => ({ key: Key, input });
createCandyMachineOperation.key = Key;

/**
 * @group Operations
 * @category Types
 */
export type CreateCandyMachineOperation<
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
> = Operation<
  typeof Key,
  CreateCandyMachineInput<T>,
  CreateCandyMachineOutput<T>
>;

/**
 * @group Operations
 * @category Inputs
 */
export type CreateCandyMachineInput<
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
> = {
  /**
   * The Candy Machine to create as a Signer.
   * This expects a brand new Keypair with no associated account.
   *
   * @defaultValue `Keypair.generate()`
   */
  candyMachine?: Signer;

  /**
   * The Signer that should pay for the creation of the Candy Machine.
   * This includes both storage fees and the transaction fee.
   *
   * @defaultValue `metaplex.identity()`
   */
  payer?: Signer;

  /**
   * Refers to the authority that is allowed to manage the Candy Machine.
   * This includes updating its data, authorities, inserting items, etc.
   *
   * @defaultValue `metaplex.identity().publicKey`
   */
  authority?: PublicKey;

  /**
   * Refers to the only authority that is allowed to mint from
   * this Candy Machine. This will refer to the address of the Candy
   * Guard associated with the Candy Machine if any.
   *
   * @defaultValue
   * - If `withoutCandyGuard` is `false` (default value),
   *   this parameter is ignored as the mint authority will be
   *   set to the Candy Guard's address.
   * - If `withoutCandyGuard` is `true`, it defaults to using the same
   *   value as the `authority` parameter.
   */
  mintAuthority?: PublicKey;

  /**
   * The mint address of the Collection NFT that all NFTs minted from
   * this Candy Machine should be part of.
   *
   * @example
   * If you do not have a Collection NFT yet, you can create one using
   * the `create` method of the NFT module and setting `isCollection` to `true`.
   *
   * ```ts
   * const { nft } = await metaplex.
   *   .nfts()
   *   .create({ isCollection: true, name: 'My Collection', ... })
   *   .run();
   * ```
   *
   * You can now use `nft.address` as the address of the collection and
   * provide the update authority as a signer, which by default, should
   * be `metaplex.identity()`.
   */
  collection: {
    address: PublicKey;
    updateAuthority: Signer;
  };

  /**
   * The royalties that should be set on minted NFTs in basis points
   *
   * @example
   * ```ts
   * { sellerFeeBasisPoints: 250 } // For 2.5% royalties.
   * ```
   */
  sellerFeeBasisPoints: number;

  /**
   * The total number of items availble in the Candy Machine, minted or not.
   *
   * @example
   * ```ts
   * { itemsAvailable: toBigNumber(1000) } // For 1000 items.
   * ```
   */
  itemsAvailable: BigNumber;

  /**
   * Settings related to the Candy Machine's items.
   *
   * These can either be inserted manually within the Candy Machine or
   * they can be infered from a set of hidden settings.
   *
   * - If `type` is `hidden`, the Candy Machine is using hidden settings.
   * - If `type` is `configLines`, the Candy Machine is using config line settings.
   *
   * @defaultValue
   * Defaults to using `configLines` settings with:
   * - No prefixes.
   * - A length of 32 for the name.
   * - A length of 200 for the URI.
   * - Random mint ordering.
   *
   * ```ts
   * {
   *   itemSettings: {
   *     type: 'configLines',
   *     prefixName: '',
   *     nameLength: 32,
   *     prefixUri: '',
   *     uriLength: 200,
   *     isSequential: false,
   *   }
   * }
   * ```
   *
   * @see {@link CandyMachineHiddenSettings}
   * @see {@link CandyMachineConfigLineSettings}
   */
  itemSettings?: CandyMachineHiddenSettings | CandyMachineConfigLineSettings;

  /**
   * The symbol to use when minting NFTs (e.g. "MYPROJECT")
   *
   * This can be any string up to 10 bytes and can be made optional
   * by providing an empty string.
   *
   * @defaultValue `""`
   */
  symbol?: string;

  /**
   * The maximum number of editions that can be printed from the
   * minted NFTs.
   *
   * For most use cases, you'd want to set this to `0` to prevent
   * minted NFTs to be printed multiple times.
   *
   * Note that you cannot set this to `null` which means unlimited editions
   * are not supported by the Candy Machine program.
   *
   * @defaultValue `toBigNumber(0)`
   */
  maxEditionSupply?: BigNumber;

  /**
   * Whether the minted NFTs should be mutable or not.
   *
   * We recommend setting this to `true` unless you have a specific reason.
   * You can always make NFTs immutable in the future but you cannot make
   * immutable NFTs mutable ever again.
   *
   * @defaultValue `true`
   */
  isMutable?: boolean;

  /**
   * Array of creators that should be set on minted NFTs.
   *
   * @see {@link Creator}
   *
   * @defaultValue
   * Defaults to using the `authority` parameter as the only creator.
   *
   * ```ts
   * [{ address: authority, share: 100 }]
   * ```
   */
  creators?: Omit<Creator, 'verified'>[];

  /**
   * The settings of all guards we wish to activate.
   *
   * Any guard not provided or set to `null` will be disabled.
   *
   * This parameter is ignored if `withoutCandyGuard` is set to `true`.
   *
   * @defaultValue `{}`, i.e. no guards are activated.
   */
  guards?: Partial<T>;

  /**
   * This parameter allows us to create multiple minting groups that have their
   * own set of requirements — i.e. guards.
   *
   * When groups are provided, the `guards` parameter becomes a set of default
   * guards that will be applied to all groups. If a specific group enables
   * a guard that is also present in the default guards, the group's guard
   * will override the default guard.
   *
   * For each group, any guard not provided or set to `null` will be disabled.
   *
   * This parameter is ignored if `withoutCandyGuard` is set to `true`.
   *
   * @defaultValue `[]`, i.e. no groups are created.
   */
  groups?: Partial<T>[];

  /**
   * Whether to skip the part of this operation that creates a Candy Guard
   * for the new Candy Machine. When set to `true`, no Candy Guard will be
   * created for the Candy Machine.
   *
   * @defaultValue `false`
   */
  withoutCandyGuard?: boolean;

  /** An optional set of programs that override the registered ones. */
  programs?: Program[];

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type CreateCandyMachineOutput<
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
> = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;

  /** The Candy Machine that was created. */
  candyMachine: CandyMachine<T>;

  /** The created Candy Machine has a Signer. */
  candyMachineSigner: Signer;
};

/**
 * @group Operations
 * @category Handlers
 */
export const createCandyMachineOperationHandler: OperationHandler<CreateCandyMachineOperation> =
  {
    async handle<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(
      operation: CreateCandyMachineOperation<T>,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<CreateCandyMachineOutput<T>> {
      const builder = await createCandyMachineBuilder(
        metaplex,
        operation.input
      );
      scope.throwIfCanceled();

      const output = await builder.sendAndConfirm(
        metaplex,
        operation.input.confirmOptions
      );
      scope.throwIfCanceled();

      const candyMachine = await metaplex
        .candyMachines()
        .findByAddress<T>({ address: output.candyMachineSigner.publicKey })
        .run();
      scope.throwIfCanceled();

      return { ...output, candyMachine };
    },
  };

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type CreateCandyMachineBuilderParams<
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
> = Omit<CreateCandyMachineInput<T>, 'confirmOptions'> & {
  /** A key to distinguish the instruction that creates the Candy Machine account. */
  createCandyMachineAccountInstructionKey?: string;

  /** A key to distinguish the instruction that initializes the Candy Machine account. */
  initializeCandyMachineInstructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type CreateCandyMachineBuilderContext = Omit<
  CreateCandyMachineOutput,
  'response' | 'candyMachine'
>;

/**
 * TODO
 *
 * ```ts
 * const transactionBuilder = await metaplex
 *   .candyMachines()
 *   .builders()
 *   .create({
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const createCandyMachineBuilder = async <
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
>(
  metaplex: Metaplex,
  params: CreateCandyMachineBuilderParams<T>
): Promise<TransactionBuilder<CreateCandyMachineBuilderContext>> => {
  // Input.
  const {
    payer = metaplex.identity(),
    candyMachine = Keypair.generate(),
    authority = metaplex.identity().publicKey,
    collection,
    sellerFeeBasisPoints,
    itemsAvailable,
    symbol = '',
    maxEditionSupply = toBigNumber(0),
    isMutable = true,
    withoutCandyGuard = false,
    programs,
  } = params;
  const creators = params.creators ?? [{ address: authority, share: 100 }];
  const itemSettings = params.itemSettings ?? {
    type: 'configLines',
    prefixName: '',
    nameLength: 32,
    prefixUri: '',
    uriLength: 200,
    isSequential: false,
  };

  // PDAs.
  const authorityPda = findCandyMachineAuthorityPda(candyMachine.publicKey);
  const collectionMetadata = findMetadataPda(collection.address);
  const collectionMasterEdition = findMasterEditionV2Pda(collection.address);
  const collectionAuthorityRecord = findCollectionAuthorityRecordPda(
    collection.address,
    authorityPda
  );

  // Programs.
  const candyMachineProgram = metaplex
    .programs()
    .get('CandyMachineProgram', programs);
  const tokenMetadataProgram = metaplex
    .programs()
    .get('TokenMetadataProgram', programs);

  const candyMachineData = toCandyMachineData({
    itemsAvailable,
    symbol,
    sellerFeeBasisPoints,
    maxEditionSupply,
    isMutable,
    creators,
    itemSettings,
  });

  const builder = TransactionBuilder.make<CreateCandyMachineBuilderContext>()
    .setFeePayer(payer)
    .setContext({ candyMachineSigner: candyMachine });

  let mintAuthority = params.mintAuthority ?? authority;

  if (!withoutCandyGuard) {
    const createCandyGuard = metaplex
      .candyMachines()
      .builders()
      .createCandyGuard({
        base: candyMachine,
        payer,
        authority,
        guards: params.guards ?? {},
        groups: params.groups,
        programs: params.programs,
      });

    const { candyGuardAddress } = createCandyGuard.getContext();
    mintAuthority = candyGuardAddress;
    builder.add(createCandyGuard);
  }

  const initializeInstruction = createInitializeInstruction(
    {
      candyMachine: candyMachine.publicKey,
      authorityPda,
      authority,
      mintAuthority,
      payer: payer.publicKey,
      collectionMetadata,
      collectionMint: collection.address,
      collectionMasterEdition,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      collectionAuthorityRecord,
      tokenMetadataProgram: tokenMetadataProgram.address,
    },
    { data: candyMachineData }
  );
  initializeInstruction.keys[8].isWritable = true;

  return builder
    .add(
      await metaplex
        .system()
        .builders()
        .createAccount({
          space: getCandyMachineSize(candyMachineData),
          payer,
          newAccount: candyMachine,
          program: candyMachineProgram.address,
        })
    )

    .add({
      instruction: initializeInstruction,
      signers: [payer, candyMachine, collection.updateAuthority],
      key:
        params.initializeCandyMachineInstructionKey ?? 'initializeCandyMachine',
    });
};
