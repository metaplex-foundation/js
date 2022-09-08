import { Metaplex } from '@/Metaplex';
import {
  BigNumber,
  Creator,
  Operation,
  OperationHandler,
  PublicKey,
  Signer,
  useOperation,
} from '@/types';
import { DisposableScope, TransactionBuilder } from '@/utils';
import { ConfirmOptions } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';

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

/**
 * @group Operations
 * @category Inputs
 */
export type CreateCandyMachineInput = {
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
   *
   * TODO: clarify this
   *
   * @defaultValue `metaplex.identity().publicKey`
   */
  authority?: PublicKey;

  /**
   * TODO: clarify this
   *
   * @defaultValue `metaplex.identity().publicKey`
   */
  updateAuthority?: PublicKey;

  /**
   * The mint address of the Collection NFT that all NFTs minted from
   * this Candy Machine should be part of.
   *
   * TODO: Explain how to create a collection NFT using the SDK.
   */
  collection: PublicKey;

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
   * The symbol to use when minting NFTs (e.g. "MYPROJECT")
   *
   * This can be any string up to 10 bytes and can be made optional
   * by providing an empty string.
   *
   * @defaultValue `""`
   */
  symbol: string;

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
  maxEditionSupply: BigNumber;

  /**
   * Whether the minted NFTs should be mutable or not.
   *
   * We recommend setting this to `true` unless you have a specific reason.
   * You can always make NFTs immutable in the future but you cannot make
   * immutable NFTs mutable ever again.
   *
   * @defaultValue `true`
   */
  isMutable: boolean;

  /**
   * Wheter the minted NFTs should use the Candy Machine authority
   * as their update authority.
   *
   * We strongly recommend setting this to `true` unless you have a
   * specific reason. When set to `false`, the update authority will
   * be given to the address that minted the NFT and you will no longer
   * be able to update the minted NFTs in the future.
   *
   * @defaultValue `true`
   */
  retainAuthority: boolean;

  /**
   * {@inheritDoc Creator}
   * @defaultValue
   * ```ts
   * [{
   *   address: metaplex.identity().publicKey,
   *   share: 100,
   * }]
   * ```
   */
  creators: Omit<Creator, 'verified'>[];

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type CreateCandyMachineOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
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
      //
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
  /** A key to distinguish the instruction that creates and initializes the Candy Guard account. */
  createCandyMachineInstructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type CreateCandyMachineBuilderContext = Omit<
  CreateCandyMachineOutput,
  'response'
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
export const createCandyMachineBuilder = (
  metaplex: Metaplex,
  params: CreateCandyMachineBuilderParams
): TransactionBuilder<CreateCandyMachineBuilderContext> => {
  return TransactionBuilder.make<CreateCandyMachineBuilderContext>()
    .setFeePayer(payer)
    .setContext({});
};
