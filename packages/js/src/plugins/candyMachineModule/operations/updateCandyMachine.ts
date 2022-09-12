import { MissingInputDataError } from '@/errors';
import { Metaplex } from '@/Metaplex';
import {
  BigNumber,
  Creator,
  Operation,
  OperationHandler,
  Program,
  PublicKey,
  Signer,
  toPublicKey,
} from '@/types';
import {
  assertObjectHasDefinedKeys,
  DisposableScope,
  TransactionBuilder,
} from '@/utils';
import {
  CandyMachineData,
  createUpdateInstruction as createUpdateCandyMachineInstruction,
} from '@metaplex-foundation/mpl-candy-machine-core';
import { ConfirmOptions } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { CandyGuardsSettings, DefaultCandyGuardSettings } from '../guards';
import {
  CandyMachine,
  CandyMachineConfigLineSettings,
  CandyMachineHiddenSettings,
  isCandyMachine,
  toCandyMachineData,
} from '../models';

// -----------------
// Operation
// -----------------

const Key = 'UpdateCandyMachineOperation' as const;

/**
 * TODO
 *
 * ```ts
 * const { candyMachine } = await metaplex
 *   .candyMachines()
 *   .update({
 *   })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const updateCandyMachineOperation = <
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
>(
  input: UpdateCandyMachineInput<T>
): UpdateCandyMachineOperation<T> => ({ key: Key, input });
updateCandyMachineOperation.key = Key;

/**
 * @group Operations
 * @category Types
 */
export type UpdateCandyMachineOperation<
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
> = Operation<typeof Key, UpdateCandyMachineInput<T>, UpdateCandyMachineOutput>;

/**
 * @group Operations
 * @category Inputs
 */
export type UpdateCandyMachineInput<
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
> = {
  /**
   * The Candy Machine to update.
   *
   * This can either be a Candy Machine instance or its address.
   * When passing its address, you will need to provide enough input
   * so the SDK knows what to update.
   *
   * For instance, if you only want to update the `creators` array of the Candy Machine,
   * you will also need to provide all other Candy Machine data such as its `symbol`,
   * its `sellerFeeBasisPoints`, etc.
   *
   * That's because the program requires all data to be provided at once when updating.
   * The SDK will raise an error if you don't provide enough data letting you know
   * what's missing.
   *
   * Alternatively, if you provide a Candy Machine instance, the SDK will use its
   * current data to fill all the gaps so you can focus on what you want to update.
   */
  candyMachine: PublicKey | CandyMachine;

  /**
   * The address of the Candy Guard associated to the Candy Machine, if any.
   * This is only required if `candyMachine` is provided as an address and
   * you are trying to update the `guards` or `groups` parameters.
   *
   * @defaultValue `candyMachine.candyGuard?.address`
   */
  candyGuard?: PublicKey;

  /**
   * The Signer authorized to update the Candy Machine.
   *
   * @defaultValue `metaplex.identity()`
   */
  authority?: Signer;

  /**
   * The Signer authorized to update the associated Candy Guard, if any.
   * This is typically the same as the Candy Machine authority.
   *
   * @defaultValue Defaults to the `authority` parameter.
   */
  candyGuardAuthority?: Signer;

  /**
   * The Signer that should pay for any changes in the Candy Machine or
   * Candy Guard account size. This includes receiving lamports if
   * the account size decreases.
   *
   * This account will also pay for the transaction fee by default.
   *
   * @defaultValue `metaplex.identity()`
   */
  payer?: Signer;

  /**
   * The new authority that will be allowed to manage the Candy Machine.
   * This includes updating its data, authorities, inserting items, etc.
   *
   * Warning: This means the current `authority` Signer will no longer be able
   * to manage the Candy Machine.
   *
   * @defaultValue Defaults to not being updated.
   */
  newAuthority?: PublicKey;

  /**
   * The new authority that will be able to mint from this Candy Machine.
   *
   * This can be used to attach or dettach a Candy Guard from a Candy Machine as
   * Candy Guards are mint authorities on Candy Machines.
   *
   * @defaultValue Defaults to not being updated.
   */
  mintAuthority?: PublicKey;

  /**
   * The Collection NFT that all NFTs minted from this Candy Machine should be part of.
   * This must include its address and the update authority as a Signer.
   *
   * @defaultValue Defaults to not being updated.
   */
  collection?: {
    address: PublicKey;
    updateAuthority: Signer;
  };

  /**
   * The royalties that should be set on minted NFTs in basis points.
   *
   * @defaultValue Defaults to not being updated.
   */
  sellerFeeBasisPoints?: number;

  /**
   * The total number of items availble in the Candy Machine, minted or not.
   *
   * @defaultValue Defaults to not being updated.
   */
  itemsAvailable?: BigNumber;

  /**
   * Settings related to the Candy Machine's items.
   *
   * These can either be inserted manually within the Candy Machine or
   * they can be infered from a set of hidden settings.
   *
   * - If `type` is `hidden`, the Candy Machine is using hidden settings.
   * - If `type` is `configLines`, the Candy Machine is using config line settings.
   *
   * @defaultValue Defaults to not being updated.
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
   * @defaultValue Defaults to not being updated.
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
   * @defaultValue Defaults to not being updated.
   */
  maxEditionSupply?: BigNumber;

  /**
   * Whether the minted NFTs should be mutable or not.
   *
   * We recommend setting this to `true` unless you have a specific reason.
   * You can always make NFTs immutable in the future but you cannot make
   * immutable NFTs mutable ever again.
   *
   * @defaultValue Defaults to not being updated.
   */
  isMutable?: boolean;

  /**
   * Array of creators that should be set on minted NFTs.
   *
   * @defaultValue Defaults to not being updated.
   *
   * @see {@link Creator}
   */
  creators?: Omit<Creator, 'verified'>[];

  /**
   * The settings of all guards we wish to activate.
   *
   * Note that this will override the existing `guards` settings
   * so you must provide all guards you wish to activate.
   *
   * Any guard not provided or set to `null` will be disabled.
   *
   * @defaultValue Defaults to not being updated.
   */
  guards?: Partial<T>;

  /**
   * This parameter allows us to create multiple minting groups that have their
   * own set of requirements — i.e. guards.
   *
   * Note that this will override the existing `groups` settings
   * so you must provide all groups and guards you wish to activate.
   *
   * When groups are provided, the `guards` parameter becomes a set of default
   * guards that will be applied to all groups. If a specific group enables
   * a guard that is also present in the default guards, the group's guard
   * will override the default guard.
   *
   * For each group, any guard not provided or set to `null` will be disabled.
   *
   * You may disable groups by providing an empty array `[]`.
   *
   * @defaultValue Defaults to not being updated.
   */
  groups?: Partial<T>[];

  /** An optional set of programs that override the registered ones. */
  programs?: Program[];

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type UpdateCandyMachineOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const updateCandyMachineOperationHandler: OperationHandler<UpdateCandyMachineOperation> =
  {
    async handle<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(
      operation: UpdateCandyMachineOperation<T>,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<UpdateCandyMachineOutput> {
      const builder = updateCandyMachineBuilder(metaplex, operation.input);
      return builder.sendAndConfirm(metaplex, operation.input.confirmOptions);
    },
  };

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type UpdateCandyMachineBuilderParams<
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
> = Omit<UpdateCandyMachineInput<T>, 'confirmOptions'> & {
  /** A key to distinguish the instruction that updates the Candy Machine data. */
  updateDataInstructionKey?: string;

  /** A key to distinguish the instruction that updates the Candy Machine authorities. */
  setAuthoritiesInstructionKey?: string;

  /** A key to distinguish the instruction that updates the Candy Machine collection. */
  setCollectionInstructionKey?: string;

  /** A key to distinguish the instruction that updates the associated Candy Guard, if any. */
  updateCandyGuardInstructionKey?: string;
};

/**
 * TODO
 *
 * ```ts
 * const transactionBuilder = await metaplex
 *   .candyMachines()
 *   .builders()
 *   .update({
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const updateCandyMachineBuilder = <
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
>(
  metaplex: Metaplex,
  params: UpdateCandyMachineBuilderParams<T>
): TransactionBuilder => {
  const {
    payer = metaplex.identity(),
    authority = metaplex.identity(),
    candyGuardAuthority = authority,
  } = params;

  return TransactionBuilder.make()
    .setFeePayer(payer)
    .add(updateCandyMachineDataBuilder(params, authority));
};

const updateCandyMachineDataBuilder = (
  params: UpdateCandyMachineBuilderParams,
  authority: Signer
): TransactionBuilder => {
  const dataToUpdate: Partial<CandyMachine> = {
    itemsAvailable: params.itemsAvailable,
    symbol: params.symbol,
    sellerFeeBasisPoints: params.sellerFeeBasisPoints,
    maxEditionSupply: params.maxEditionSupply,
    isMutable: params.isMutable,
    creators: params.creators,
    itemSettings: params.itemSettings,
  };
  const dataKeys = [
    'itemsAvailable',
    'symbol',
    'sellerFeeBasisPoints',
    'maxEditionSupply',
    'isMutable',
    'creators',
    'itemSettings',
  ] as const;

  const fooKeys = ['foo'] as const;
  assertObjectHasDefinedKeys(
    { foo: 42 },
    ['foo'] as typeof fooKeys[number][],
    (x) => new MissingInputDataError(x)
  );

  let data: CandyMachineData;
  if (isCandyMachine(params.candyMachine)) {
    data = toCandyMachineData({ ...params.candyMachine, ...dataToUpdate });
  } else {
    assertObjectHasDefinedKeys(dataToUpdate, dataKeys, onMissingInputError);
    data = toCandyMachineData(dataToUpdate);
  }

  return TransactionBuilder.make().add({
    instruction: createUpdateCandyMachineInstruction(
      {
        candyMachine: toPublicKey(params.candyMachine),
        authority: authority.publicKey,
      },
      { data }
    ),
    signers: [authority],
    key: params.updateDataInstructionKey ?? 'updateCandyMachineData',
  });
};

const updateCandyMachineAuthoritiesBuilder = (
  input: UpdateCandyMachineBuilderParams
): TransactionBuilder => {
  return TransactionBuilder.make();
};

const updateCandyMachineCollectionBuilder = (
  input: UpdateCandyMachineBuilderParams
): TransactionBuilder => {
  return TransactionBuilder.make();
};

const updateCandyGuardsBuilder = (
  input: UpdateCandyMachineBuilderParams
): TransactionBuilder => {
  return TransactionBuilder.make();
};

const onMissingInputError = (missingKeys: string[]) =>
  new MissingInputDataError(missingKeys, {
    problem:
      'When passing the Candy Machine as a `PublicKey` instead of a Candy Machine model ' +
      'the SDK cannot rely on current data to fill the gaps within the provided input.',
    solutionSuffix:
      ' Alternatively, you can pass the Candy Machine model instead.',
  });
