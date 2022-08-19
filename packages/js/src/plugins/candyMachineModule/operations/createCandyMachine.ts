import { Metaplex } from '@/Metaplex';
import {
  assertSameCurrencies,
  isSigner,
  Operation,
  OperationHandler,
  Signer,
  SOL,
  toBigNumber,
  toPublicKey,
  useOperation,
} from '@/types';
import {
  DisposableScope,
  Option,
  RequiredKeys,
  TransactionBuilder,
} from '@/utils';
import {
  createInitializeCandyMachineInstruction,
  createSetCollectionInstruction,
  Creator,
} from '@metaplex-foundation/mpl-candy-machine';
import { ConfirmOptions, Keypair, PublicKey } from '@solana/web3.js';
import {
  findCollectionAuthorityRecordPda,
  findMasterEditionV2Pda,
  findMetadataPda,
  TokenMetadataProgram,
} from '../../nftModule';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import {
  CandyMachine,
  CandyMachineConfigs,
  toCandyMachineInstructionData,
} from '../models/CandyMachine';
import { ExpectedSignerError } from '@/errors';
import { getCandyMachineAccountSizeFromData } from '../helpers';
import { findCandyMachineCollectionPda } from '../pdas';
import { CandyMachineProgram } from '../program';

// -----------------
// Operation
// -----------------

const Key = 'CreateCandyMachineOperation' as const;

/**
 * Creates a brand new Candy Machine.
 *
 * ```ts
 * const { candyMachine } = await metaplex
 *   .candyMachines()
 *   .create({
 *     sellerFeeBasisPoints: 500, // 5% royalties
 *     price: sol(1.3), // 1.3 SOL
 *     itemsAvailable: toBigNumber(1000), // 1000 items available
 *   })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const createCandyMachineOperation =
  useOperation<CreateCandyMachineOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type CreateCandyMachineOperation = Operation<
  typeof Key,
  CreateCandyMachineInput,
  CreateCandyMachineOutput
>;

export type CreateCandyMachineInputWithoutConfigs = {
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
   * The authority that will be allowed to update the Candy Machine.
   * Upon creation, passing the authority's public key is enough to set it.
   * However, when also passing a `collection` to this operation,
   * this authority will need to be passed as a Signer so the relevant
   * instruction can be signed.
   *
   * @defaultValue `metaplex.identity()`
   */
  authority?: Signer | PublicKey; // Defaults to mx.identity().

  /**
   * The mint address of the Collection NFT that all NFTs minted from
   * this Candy Machine should be part of.
   * When provided, the `authority` parameter will need to be passed as a `Signer`.
   * When `null`, minted NFTs won't be part of a collection.
   *
   * @defaultValue `null`
   */
  collection?: Option<PublicKey>;

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Inputs
 */
export type CreateCandyMachineInput = CreateCandyMachineInputWithoutConfigs &
  RequiredKeys<
    Partial<CandyMachineConfigs>,
    'price' | 'sellerFeeBasisPoints' | 'itemsAvailable'
  >;

/**
 * @group Operations
 * @category Outputs
 */
export type CreateCandyMachineOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;

  /** The created Candy Machine. */
  candyMachine: CandyMachine;

  /** The create Candy Machine's account as a Signer. */
  candyMachineSigner: Signer;

  /** The account that ended up paying for the Candy Machine as a Signer. */
  payer: Signer;

  /** The created Candy Machine's wallet. */
  wallet: PublicKey;

  /** The created Candy Machine's authority. */
  authority: PublicKey;

  /** The created Candy Machine's creators. */
  creators: Creator[];
};

/**
 * @group Operations
 * @category Handlers
 */
export const createCandyMachineOperationHandler: OperationHandler<CreateCandyMachineOperation> =
  {
    async handle(
      operation: CreateCandyMachineOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<CreateCandyMachineOutput> {
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
        .findByAddress({ address: output.candyMachineSigner.publicKey })
        .run(scope);

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
export type CreateCandyMachineBuilderParams = Omit<
  CreateCandyMachineInput,
  'confirmOptions'
> & {
  /** A key to distinguish the instruction that creates the account. */
  createAccountInstructionKey?: string;

  /** A key to distinguish the instruction that initializes the Candy Machine. */
  initializeCandyMachineInstructionKey?: string;

  /** A key to distinguish the instruction that sets the collection. */
  setCollectionInstructionKey?: string;
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
 * Creates a brand new Candy Machine.
 *
 * ```ts
 * const transactionBuilder = await metaplex
 *   .candyMachines()
 *   .builders()
 *   .create({
 *     sellerFeeBasisPoints: 500, // 5% royalties
 *     price: sol(1.3), // 1.3 SOL
 *     itemsAvailable: toBigNumber(1000), // 1000 items available
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const createCandyMachineBuilder = async (
  metaplex: Metaplex,
  params: CreateCandyMachineBuilderParams
): Promise<TransactionBuilder<CreateCandyMachineBuilderContext>> => {
  const candyMachine = params.candyMachine ?? Keypair.generate();
  const payer: Signer = params.payer ?? metaplex.identity();
  const authority = params.authority ?? metaplex.identity();
  const collection: PublicKey | null = params.collection ?? null;

  const { data, wallet, tokenMint } = toCandyMachineInstructionData(
    candyMachine.publicKey,
    {
      ...params,
      wallet: params.wallet ?? metaplex.identity().publicKey,
      tokenMint: params.tokenMint ?? null,
      symbol: params.symbol ?? '',
      maxEditionSupply: params.maxEditionSupply ?? toBigNumber(0),
      isMutable: params.isMutable ?? true,
      retainAuthority: params.retainAuthority ?? true,
      goLiveDate: params.goLiveDate ?? null,
      endSettings: params.endSettings ?? null,
      creators: params.creators ?? [
        {
          address: metaplex.identity().publicKey,
          share: 100,
          verified: false,
        },
      ],
      hiddenSettings: params.hiddenSettings ?? null,
      whitelistMintSettings: params.whitelistMintSettings ?? null,
      gatekeeper: params.gatekeeper ?? null,
    }
  );

  const initializeInstruction = createInitializeCandyMachineInstruction(
    {
      candyMachine: candyMachine.publicKey,
      wallet,
      authority: toPublicKey(authority),
      payer: payer.publicKey,
    },
    { data }
  );

  if (tokenMint) {
    initializeInstruction.keys.push({
      pubkey: tokenMint,
      isWritable: false,
      isSigner: false,
    });
  } else {
    assertSameCurrencies(params.price, SOL);
  }

  return (
    TransactionBuilder.make<CreateCandyMachineBuilderContext>()
      .setFeePayer(payer)
      .setContext({
        candyMachineSigner: candyMachine,
        payer,
        wallet,
        authority: toPublicKey(authority),
        creators: data.creators,
      })

      // Create an empty account for the candy machine.
      .add(
        await metaplex
          .system()
          .builders()
          .createAccount({
            payer,
            newAccount: candyMachine,
            space: getCandyMachineAccountSizeFromData(data),
            program: CandyMachineProgram.publicKey,
            instructionKey:
              params.createAccountInstructionKey ?? 'createAccount',
          })
      )

      // Initialize the candy machine account.
      .add({
        instruction: initializeInstruction,
        signers: [candyMachine, payer],
        key:
          params.initializeCandyMachineInstructionKey ??
          'initializeCandyMachine',
      })

      // Set the collection.
      .when(!!collection, (builder) => {
        if (!isSigner(authority)) {
          throw new ExpectedSignerError('authority', 'PublicKey', {
            problemSuffix:
              'You are trying to create a Candy Machine with a Collection NFT. ' +
              'In order for the Collection NFT to be set successfully, you must provide the authority as a Signer.',
            solution:
              'Please provide the "authority" parameter as a Signer if you want to set the Collection NFT upon creation. ' +
              'Alternatively, you may remove the "collection" parameter to create a Candy Machine without an associated Collection NFT.',
          });
        }

        const collectionMint = collection as PublicKey;
        const metadata = findMetadataPda(collectionMint);
        const edition = findMasterEditionV2Pda(collectionMint);
        const collectionPda = findCandyMachineCollectionPda(
          candyMachine.publicKey
        );
        const collectionAuthorityRecord = findCollectionAuthorityRecordPda(
          collectionMint,
          collectionPda
        );

        return builder.add({
          instruction: createSetCollectionInstruction({
            candyMachine: candyMachine.publicKey,
            authority: toPublicKey(authority),
            collectionPda,
            payer: payer.publicKey,
            metadata,
            mint: collectionMint,
            edition,
            collectionAuthorityRecord,
            tokenMetadataProgram: TokenMetadataProgram.publicKey,
          }),
          signers: [authority],
          key: params.setCollectionInstructionKey ?? 'setCollection',
        });
      })
  );
};
