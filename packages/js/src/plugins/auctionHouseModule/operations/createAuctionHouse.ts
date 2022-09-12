import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import {
  AuthorityScope,
  createCreateAuctionHouseInstruction,
  createDelegateAuctioneerInstruction,
} from '@metaplex-foundation/mpl-auction-house';
import type { Metaplex } from '@/Metaplex';
import {
  useOperation,
  Operation,
  Signer,
  OperationHandler,
  Pda,
  isSigner,
  toPublicKey,
} from '@/types';
import { DisposableScope, TransactionBuilder } from '@/utils';
import { findAssociatedTokenAccountPda } from '../../tokenModule';
import {
  findAuctioneerPda,
  findAuctionHouseFeePda,
  findAuctionHousePda,
  findAuctionHouseTreasuryPda,
} from '../pdas';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { WRAPPED_SOL_MINT } from '../../tokenModule';
import { AUCTIONEER_ALL_SCOPES } from '../constants';
import { ExpectedSignerError } from '@/errors';
import { AuctionHouse } from '../models/AuctionHouse';

// -----------------
// Operation
// -----------------

const Key = 'CreateAuctionHouseOperation' as const;

/**
 * Creates an Auction House.
 *
 * ```ts
 * await metaplex
 *   .auctionHouse()
 *   .create({ sellerFeeBasisPoints: 500 }) // 5% fee
 *   .run();
 * ```
 *
 * Provide `auctioneerAuthority` in case you want to enable Auctioneer.
 *
 * ```ts
 * await metaplex
 *   .auctionHouse()
 *   .create({ sellerFeeBasisPoints: 500, auctioneerAuthority: mx.identity().publicKey })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const createAuctionHouseOperation =
  useOperation<CreateAuctionHouseOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type CreateAuctionHouseOperation = Operation<
  typeof Key,
  CreateAuctionHouseInput,
  CreateAuctionHouseOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type CreateAuctionHouseInput = {
  /** The share of the sale the auction house takes on all NFTs as a fee. */
  sellerFeeBasisPoints: number;

  /**
   * This allows the centralised authority to gate which NFT can be listed, bought and sold.
   *
   * @defaultValue `canChangeSalePrice`
   */
  requiresSignOff?: boolean;

  /**
   * Is intended to be used with the Auction House that requires sign off.
   * If the seller intentionally lists their NFT for a price of 0, a new FreeSellerTradeState is made.
   * The Auction House can then change the price to match a matching Bid that is greater than 0.
   *
   * @defaultValue `false`
   */
  canChangeSalePrice?: boolean;

  /**
   * The list of scopes available to the user in the Auctioneer.
   * For example Bid, List, Execute Sale.
   *
   * Only takes place when Auction House has Auctioneer enabled.
   *
   * @defaultValue `All scopes available`
   */
  auctioneerScopes?: AuthorityScope[];

  /**
   * The address of the Auction House treasury mint.
   * The token you accept as the purchase currency.
   *
   * @defaultValue `WRAPPED_SOL_MINT`
   */
  treasuryMint?: PublicKey;

  /**
   * The Signer paying for the creation of all accounts
   * required to create the Auction House.
   *
   * @defaultValue `metaplex.identity()`
   */
  payer?: Signer;

  /**
   * The Authority wallet of the Auction House.
   * It is used to sign off listings and bids in case `requiresSignOff` is true.
   *
   * @defaultValue `metaplex.identity()`
   */
  authority?: PublicKey | Signer;

  /**
   * The account that is marked as a destination of withdrawal from the fee account.
   *
   * @defaultValue `metaplex.identity()`
   */
  feeWithdrawalDestination?: PublicKey;

  /**
   * The account that is marked as the owner of treasury withdrawal destination.
   *
   * @defaultValue `metaplex.identity()`
   */
  treasuryWithdrawalDestinationOwner?: PublicKey;

  /**
   * The Auctioneer authority key.
   * It is required when Auction House is going to have Auctioneer enabled.
   *
   * @defaultValue No default value.
   */
  auctioneerAuthority?: PublicKey;

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type CreateAuctionHouseOutput = {
  /** The address of the Auction House. */
  auctionHouseAddress: Pda;

  /** The account that used to pay the fees for selling and buying. */
  auctionHouseFeeAccountAddress: Pda;

  /** The account that receives the AuctionHouse fees. */
  auctionHouseTreasuryAddress: Pda;

  /** The account that is marked as a destination of withdrawal from the treasury account. */
  treasuryWithdrawalDestinationAddress: PublicKey;

  /** Auction House model. */
  auctionHouse: AuctionHouse;

  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const createAuctionHouseOperationHandler: OperationHandler<CreateAuctionHouseOperation> =
  {
    async handle(
      operation: CreateAuctionHouseOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<CreateAuctionHouseOutput> {
      const output = await createAuctionHouseBuilder(
        metaplex,
        operation.input
      ).sendAndConfirm(metaplex, operation.input.confirmOptions);
      scope.throwIfCanceled();
      const auctionHouse = await metaplex
        .auctionHouse()
        .findByAddress({
          address: output.auctionHouseAddress,
          auctioneerAuthority: operation.input.auctioneerAuthority,
        })
        .run(scope);
      return { ...output, auctionHouse };
    },
  };

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type CreateAuctionHouseBuilderParams = Omit<
  CreateAuctionHouseInput,
  'confirmOptions'
> & {
  instructionKey?: string;
  delegateAuctioneerInstructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type CreateAuctionHouseBuilderContext = Omit<
  CreateAuctionHouseOutput,
  'response' | 'auctionHouse'
>;

/**
 * Creates an Auction House.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .auctionHouse()
 *   .builders()
 *   .createAuctionHouse({ sellerFeeBasisPoints: 500 }) // 5% fee
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const createAuctionHouseBuilder = (
  metaplex: Metaplex,
  params: CreateAuctionHouseBuilderParams
): TransactionBuilder<CreateAuctionHouseBuilderContext> => {
  // Data.
  const canChangeSalePrice = params.canChangeSalePrice ?? false;
  const requiresSignOff = params.requiresSignOff ?? canChangeSalePrice;

  // Accounts.
  const authority = params.authority ?? metaplex.identity();
  const payer = params.payer ?? metaplex.identity();
  const treasuryMint = params.treasuryMint ?? WRAPPED_SOL_MINT;
  const treasuryWithdrawalDestinationOwner =
    params.treasuryWithdrawalDestinationOwner ?? metaplex.identity().publicKey;
  const feeWithdrawalDestination =
    params.feeWithdrawalDestination ?? metaplex.identity().publicKey;

  // Auctioneer delegate instruction needs to be signed by authority
  if (params.auctioneerAuthority && !isSigner(authority)) {
    throw new ExpectedSignerError('authority', 'PublicKey', {
      problemSuffix:
        'You are trying to delegate to an Auctioneer authority which ' +
        'requires the Auction House authority to sign a transaction. ' +
        'But you provided the Auction House authority as a Public Key.',
    });
  }

  // PDAs.
  const auctionHouse = findAuctionHousePda(
    toPublicKey(authority),
    treasuryMint
  );
  const auctionHouseFeeAccount = findAuctionHouseFeePda(auctionHouse);
  const auctionHouseTreasury = findAuctionHouseTreasuryPda(auctionHouse);
  const treasuryWithdrawalDestination = treasuryMint.equals(WRAPPED_SOL_MINT)
    ? treasuryWithdrawalDestinationOwner
    : findAssociatedTokenAccountPda(
        treasuryMint,
        treasuryWithdrawalDestinationOwner
      );

  return (
    TransactionBuilder.make<CreateAuctionHouseBuilderContext>()
      .setFeePayer(payer)
      .setContext({
        auctionHouseAddress: auctionHouse,
        auctionHouseFeeAccountAddress: auctionHouseFeeAccount,
        auctionHouseTreasuryAddress: auctionHouseTreasury,
        treasuryWithdrawalDestinationAddress: treasuryWithdrawalDestination,
      })

      // Create and initialize the Auction House account.
      .add({
        instruction: createCreateAuctionHouseInstruction(
          {
            treasuryMint,
            payer: payer.publicKey,
            authority: toPublicKey(authority),
            feeWithdrawalDestination,
            treasuryWithdrawalDestination,
            treasuryWithdrawalDestinationOwner,
            auctionHouse,
            auctionHouseFeeAccount,
            auctionHouseTreasury,
          },
          {
            bump: auctionHouse.bump,
            feePayerBump: auctionHouseFeeAccount.bump,
            treasuryBump: auctionHouseTreasury.bump,
            sellerFeeBasisPoints: params.sellerFeeBasisPoints,
            requiresSignOff,
            canChangeSalePrice,
          }
        ),
        signers: [payer],
        key: params.instructionKey ?? 'createAuctionHouse',
      })

      // Delegate to the Auctioneer authority when provided.
      .when(Boolean(params.auctioneerAuthority), (builder) => {
        const auctioneerAuthority = params.auctioneerAuthority as PublicKey;
        return builder.add({
          instruction: createDelegateAuctioneerInstruction(
            {
              auctionHouse,
              authority: toPublicKey(authority as Signer),
              auctioneerAuthority,
              ahAuctioneerPda: findAuctioneerPda(
                auctionHouse,
                auctioneerAuthority
              ),
            },
            { scopes: params.auctioneerScopes ?? AUCTIONEER_ALL_SCOPES }
          ),
          signers: [authority as Signer],
          key: params.delegateAuctioneerInstructionKey ?? 'delegateAuctioneer',
        });
      })
  );
};
