import {
  ConfirmOptions,
  PublicKey,
  SYSVAR_INSTRUCTIONS_PUBKEY,
} from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { TransactionBuilder, Option, DisposableScope } from '@/utils';
import {
  BuyInstructionAccounts,
  createAuctioneerBuyInstruction,
  createAuctioneerPublicBuyInstruction,
  createBuyInstruction,
  createPrintBidReceiptInstruction,
  createPublicBuyInstruction,
} from '@metaplex-foundation/mpl-auction-house';
import {
  useOperation,
  Operation,
  OperationHandler,
  Signer,
  toPublicKey,
  token,
  lamports,
  isSigner,
  amount,
  SolAmount,
  SplTokenAmount,
  Pda,
  now,
} from '@/types';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { findAssociatedTokenAccountPda } from '../../tokenModule';
import { findMetadataPda } from '../../nftModule';
import { AuctionHouse, Bid, LazyBid } from '../models';
import {
  findAuctioneerPda,
  findAuctionHouseBuyerEscrowPda,
  findAuctionHouseTradeStatePda,
  findBidReceiptPda,
} from '../pdas';
import { AuctioneerAuthorityRequiredError } from '../errors';

// -----------------
// Operation
// -----------------

const Key = 'CreateBidOperation' as const;

/**
 * Creates a bid on a given asset.
 *
 * You can post a public bid on a non-listed NFT by skipping seller and tokenAccount properties.
 * Public bids are specific to the token itself and not to any specific auction.
 * This means that a bid can stay active beyond the end of an auction
 * and be resolved if it meets the criteria for subsequent auctions of that token.
 *
 *
 * ```ts
 * await metaplex
 *   .auctionHouse()
 *   .createBid({ auctionHouse, mintAccount, seller })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const createBidOperation = useOperation<CreateBidOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type CreateBidOperation = Operation<
  typeof Key,
  CreateBidInput,
  CreateBidOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type CreateBidInput = {
  /** The Auction House in which to create a Bid. */
  auctionHouse: AuctionHouse;

  /**
   * Creator of a bid.
   *
   * @defaultValue `metaplex.identity()`
   */
  buyer?: Signer;

  /**
   * The Auction House authority.
   * If this is Signer the transaction fee
   * will be paid from the Auction House Fee Account
   *
   * @defaultValue `auctionHouse.authority`
   */
  authority?: PublicKey | Signer;

  /**
   * The Auctioneer authority key.
   * It is required when Auction House has Auctioneer enabled.
   *
   * @defaultValue No default value.
   */
  auctioneerAuthority?: Signer;

  /**
   * The mint account to create a bid for.
   * This is used to find the metadata.
   */
  mintAccount: PublicKey;

  /**
   * The account address that holds the asset a bid created is for.
   * If this or tokenAccount isn't provided, then the bid will be public.
   *
   * @defaultValue No default value.
   */
  seller?: Option<PublicKey>;

  /**
   * The token account address that's associated to the asset a bid created is for.
   * If this or seller isn't provided, then the bid will be public.
   *
   * @defaultValue No default value.
   */
  tokenAccount?: Option<PublicKey>;

  /**
   * The buyer's price.
   *
   * @defaultValue 0 SOLs or tokens.
   */
  price?: SolAmount | SplTokenAmount; // Default: 0 SOLs or tokens.

  /**
   * The number of tokens to bid for.
   * For an NFT bid it must be 1 token.
   *
   * When a Fungible Asset is put on sale.
   * The buyer can then create a buy order of said assets that is
   * less than the token_size of the sell order.
   *
   * @defaultValue 1 token.
   */
  tokens?: SplTokenAmount;

  /**
   * Prints the bid receipt.
   * The receipt holds information about the bid,
   * So it's important to print it if you want to use the `Bid` model
   *
   * The receipt printing is skipped for the Auctioneer Auction House
   * Since it currently doesn't support it.
   *
   * @defaultValue `true`
   */
  printReceipt?: boolean;

  /**
   * The address of the bookkeeper wallet responsible for the receipt.
   *
   * @defaultValue `metaplex.identity()`
   */
  bookkeeper?: Signer;

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type CreateBidOutput = {
  /** Buyer trade state account PDA encoding the bid order. */
  buyerTradeState: Pda;

  /** The asset's token account address in case the bid is private. */
  tokenAccount: Option<PublicKey>;

  /** The asset's metadata PDA. */
  metadata: Pda;

  /** The potential buyer of the asset. */
  buyer: PublicKey;

  /** The PDA of the receipt account in case it was printed. */
  receipt: Option<Pda>;

  /** The address of the bookkeeper wallet responsible for the receipt. */
  bookkeeper: Option<PublicKey>;

  /** The buyer's price. */
  price: SolAmount | SplTokenAmount;

  /** The number of tokens to bid for. */
  tokens: SplTokenAmount;

  /** A model that keeps information about the Bid. */
  bid: Bid;

  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const createBidOperationHandler: OperationHandler<CreateBidOperation> = {
  async handle(
    operation: CreateBidOperation,
    metaplex: Metaplex,
    scope: DisposableScope
  ): Promise<CreateBidOutput> {
    const { auctionHouse, confirmOptions } = operation.input;

    const builder = await createBidBuilder(metaplex, operation.input);
    const output = await builder.sendAndConfirm(metaplex, confirmOptions);
    scope.throwIfCanceled();

    if (output.receipt) {
      const bid = await metaplex
        .auctionHouse()
        .findBidByReceipt({
          auctionHouse,
          receiptAddress: output.receipt,
        })
        .run(scope);

      return { bid, ...output };
    }

    scope.throwIfCanceled();
    const lazyBid: LazyBid = {
      model: 'bid',
      lazy: true,
      auctionHouse,
      tradeStateAddress: output.buyerTradeState,
      bookkeeperAddress: output.bookkeeper,
      tokenAddress: output.tokenAccount,
      buyerAddress: output.buyer,
      metadataAddress: output.metadata,
      receiptAddress: output.receipt,
      purchaseReceiptAddress: null,
      isPublic: Boolean(output.tokenAccount),
      price: output.price,
      tokens: output.tokens.basisPoints,
      createdAt: now(),
      canceledAt: null,
    };

    return {
      bid: await metaplex.auctionHouse().loadBid({ lazyBid }).run(scope),
      ...output,
    };
  },
};

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type CreateBidBuilderParams = Omit<CreateBidInput, 'confirmOptions'> & {
  instructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type CreateBidBuilderContext = Omit<CreateBidOutput, 'response' | 'bid'>;

/**
 * Creates a bid on a given asset.
 *
 * You can post a public bid on a non-listed NFT by skipping seller and tokenAccount properties.
 * Public bids are specific to the token itself and not to any specific auction.
 * This means that a bid can stay active beyond the end of an auction
 * and be resolved if it meets the criteria for subsequent auctions of that token.
 *
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .auctionHouse()
 *   .builders()
 *   .createBid({ auctionHouse, mintAccount, seller })
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const createBidBuilder = async (
  metaplex: Metaplex,
  params: CreateBidBuilderParams
): Promise<TransactionBuilder<CreateBidBuilderContext>> => {
  // Data.
  const auctionHouse = params.auctionHouse;
  const tokens = params.tokens ?? token(1);
  const priceBasisPoint = params.price?.basisPoints ?? 0;
  const price = auctionHouse.isNative
    ? lamports(priceBasisPoint)
    : amount(priceBasisPoint, auctionHouse.treasuryMint.currency);

  if (auctionHouse.hasAuctioneer && !params.auctioneerAuthority) {
    throw new AuctioneerAuthorityRequiredError();
  }

  // Accounts.
  const buyer = params.buyer ?? (metaplex.identity() as Signer);
  const authority = params.authority ?? auctionHouse.authorityAddress;
  const metadata = findMetadataPda(params.mintAccount);
  const paymentAccount = auctionHouse.isNative
    ? toPublicKey(buyer)
    : findAssociatedTokenAccountPda(
        auctionHouse.treasuryMint.address,
        toPublicKey(buyer)
      );
  const escrowPayment = findAuctionHouseBuyerEscrowPda(
    auctionHouse.address,
    toPublicKey(buyer)
  );
  const tokenAccount =
    params.tokenAccount ??
    (params.seller
      ? findAssociatedTokenAccountPda(params.mintAccount, params.seller)
      : null);
  const buyerTokenAccount = findAssociatedTokenAccountPda(
    params.mintAccount,
    toPublicKey(buyer)
  );

  const buyerTradeState = findAuctionHouseTradeStatePda(
    auctionHouse.address,
    toPublicKey(buyer),
    auctionHouse.treasuryMint.address,
    params.mintAccount,
    price.basisPoints,
    tokens.basisPoints,
    tokenAccount
  );

  const accounts: Omit<BuyInstructionAccounts, 'tokenAccount'> = {
    wallet: toPublicKey(buyer),
    paymentAccount,
    transferAuthority: toPublicKey(buyer),
    treasuryMint: auctionHouse.treasuryMint.address,
    metadata,
    escrowPaymentAccount: escrowPayment,
    authority: toPublicKey(authority),
    auctionHouse: auctionHouse.address,
    auctionHouseFeeAccount: auctionHouse.feeAccountAddress,
    buyerTradeState,
  };

  // Args.
  const args = {
    tradeStateBump: buyerTradeState.bump,
    escrowPaymentBump: escrowPayment.bump,
    buyerPrice: price.basisPoints,
    tokenSize: tokens.basisPoints,
  };

  // Sell Instruction.
  let buyInstruction;
  if (params.auctioneerAuthority) {
    const ahAuctioneerPda = findAuctioneerPda(
      auctionHouse.address,
      params.auctioneerAuthority.publicKey
    );

    const accountsWithAuctioneer = {
      ...accounts,
      auctioneerAuthority: params.auctioneerAuthority.publicKey,
      ahAuctioneerPda,
    };

    buyInstruction = tokenAccount
      ? createAuctioneerBuyInstruction(
          { ...accountsWithAuctioneer, tokenAccount },
          args
        )
      : createAuctioneerPublicBuyInstruction(
          {
            ...accountsWithAuctioneer,
            tokenAccount: buyerTokenAccount,
          },
          args
        );
  } else {
    buyInstruction = tokenAccount
      ? createBuyInstruction({ ...accounts, tokenAccount }, args)
      : createPublicBuyInstruction(
          { ...accounts, tokenAccount: buyerTokenAccount },
          args
        );
  }

  // Signers.
  const buySigners = [buyer, authority, params.auctioneerAuthority].filter(
    isSigner
  );

  // Receipt.
  // Since createPrintBidReceiptInstruction can't deserialize createAuctioneerBuyInstruction due to a bug
  // Don't print Auctioneer Bid receipt for the time being.
  const shouldPrintReceipt =
    (params.printReceipt ?? true) && !params.auctioneerAuthority;
  const bookkeeper = params.bookkeeper ?? metaplex.identity();
  const receipt = findBidReceiptPda(buyerTradeState);

  const builder = TransactionBuilder.make<CreateBidBuilderContext>().setContext(
    {
      buyerTradeState,
      tokenAccount,
      metadata,
      buyer: toPublicKey(buyer),
      receipt: shouldPrintReceipt ? receipt : null,
      bookkeeper: shouldPrintReceipt ? bookkeeper.publicKey : null,
      price,
      tokens,
    }
  );

  // Create a TA for public bid if it doesn't exist
  if (!tokenAccount) {
    const account = await metaplex.rpc().getAccount(buyerTokenAccount);
    if (!account.exists) {
      builder.add(
        await metaplex
          .tokens()
          .builders()
          .createToken({
            mint: params.mintAccount,
            owner: toPublicKey(buyer),
          })
      );
    }
  }

  return (
    builder
      // Create bid.
      .add({
        instruction: buyInstruction,
        signers: buySigners,
        key: 'buy',
      })

      // Print the Bid Receipt.
      .when(shouldPrintReceipt, (builder) =>
        builder.add({
          instruction: createPrintBidReceiptInstruction(
            {
              receipt,
              bookkeeper: bookkeeper.publicKey,
              instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
            },
            { receiptBump: receipt.bump }
          ),
          signers: [bookkeeper],
          key: 'printBidReceipt',
        })
      )
  );
};
