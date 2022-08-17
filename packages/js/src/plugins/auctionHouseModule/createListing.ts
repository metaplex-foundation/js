import {
  ConfirmOptions,
  PublicKey,
  SYSVAR_INSTRUCTIONS_PUBKEY,
} from '@solana/web3.js';
import {
  createAuctioneerSellInstruction,
  createPrintListingReceiptInstruction,
  createSellInstruction,
} from '@metaplex-foundation/mpl-auction-house';
import type { Metaplex } from '@/Metaplex';
import type { SendAndConfirmTransactionResponse } from '../rpcModule';
import {
  useOperation,
  Operation,
  OperationHandler,
  Signer,
  toPublicKey,
  token,
  lamports,
  isSigner,
  Pda,
  amount,
  SolAmount,
  SplTokenAmount,
} from '@/types';
import { TransactionBuilder, Option } from '@/utils';
import {
  findAuctioneerPda,
  findAuctionHouseProgramAsSignerPda,
  findAuctionHouseTradeStatePda,
  findListingReceiptPda,
} from './pdas';
import { AuctionHouse } from './AuctionHouse';
import { findAssociatedTokenAccountPda } from '../tokenModule';
import { findMetadataPda } from '../nftModule';
import { AUCTIONEER_PRICE } from './constants';
import { AuctioneerAuthorityRequiredError } from './errors';

// -----------------
// Operation
// -----------------

const Key = 'CreateListingOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const createListingOperation = useOperation<CreateListingOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type CreateListingOperation = Operation<
  typeof Key,
  CreateListingInput,
  CreateListingOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type CreateListingInput = {
  auctionHouse: AuctionHouse;
  seller?: PublicKey | Signer; // Default: identity
  authority?: PublicKey | Signer; // Default: auctionHouse.authority
  auctioneerAuthority?: Signer; // Use Auctioneer ix when provided
  mintAccount: PublicKey; // Required for checking Metadata
  tokenAccount?: PublicKey; // Default: ATA
  price?: SolAmount | SplTokenAmount; // Default: 0 SOLs or tokens, ignored in Auctioneer.
  tokens?: SplTokenAmount; // Default: token(1)
  bookkeeper?: Signer; // Default: identity
  printReceipt?: boolean; // Default: true

  // Options.
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type CreateListingOutput = {
  response: SendAndConfirmTransactionResponse;
  sellerTradeState: Pda;
  freeSellerTradeState: Pda;
  tokenAccount: PublicKey;
  metadata: Pda;
  seller: PublicKey;
  receipt: Option<Pda>;
  bookkeeper: Option<PublicKey>;
  price: SolAmount | SplTokenAmount;
  tokens: SplTokenAmount;
};

/**
 * @group Operations
 * @category Handlers
 */
export const createListingOperationHandler: OperationHandler<CreateListingOperation> =
  {
    handle: async (operation: CreateListingOperation, metaplex: Metaplex) => {
      return createListingBuilder(metaplex, operation.input).sendAndConfirm(
        metaplex,
        operation.input.confirmOptions
      );
    },
  };

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type CreateListingBuilderParams = Omit<
  CreateListingInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type CreateListingBuilderContext = Omit<CreateListingOutput, 'response'>;

/**
 * @group Transaction Builders
 * @category Constructors
 */
export const createListingBuilder = (
  metaplex: Metaplex,
  params: CreateListingBuilderParams
): TransactionBuilder<CreateListingBuilderContext> => {
  // Data.
  const auctionHouse = params.auctionHouse;
  const tokens = params.tokens ?? token(1);
  const priceBasisPoint = params.auctioneerAuthority
    ? AUCTIONEER_PRICE
    : params.price?.basisPoints ?? 0;
  const price = auctionHouse.isNative
    ? lamports(priceBasisPoint)
    : amount(priceBasisPoint, auctionHouse.treasuryMint.currency);

  if (auctionHouse.hasAuctioneer && !params.auctioneerAuthority) {
    throw new AuctioneerAuthorityRequiredError();
  }

  // Accounts.
  const seller = params.seller ?? (metaplex.identity() as Signer);
  const authority = params.authority ?? auctionHouse.authorityAddress;
  const metadata = findMetadataPda(params.mintAccount);
  const tokenAccount =
    params.tokenAccount ??
    findAssociatedTokenAccountPda(params.mintAccount, toPublicKey(seller));
  const sellerTradeState = findAuctionHouseTradeStatePda(
    auctionHouse.address,
    toPublicKey(seller),
    auctionHouse.treasuryMint.address,
    params.mintAccount,
    price.basisPoints,
    tokens.basisPoints,
    tokenAccount
  );
  const freeSellerTradeState = findAuctionHouseTradeStatePda(
    auctionHouse.address,
    toPublicKey(seller),
    auctionHouse.treasuryMint.address,
    params.mintAccount,
    lamports(0).basisPoints,
    tokens.basisPoints,
    tokenAccount
  );
  const programAsSigner = findAuctionHouseProgramAsSignerPda();
  const accounts = {
    wallet: toPublicKey(seller),
    tokenAccount,
    metadata,
    authority: toPublicKey(authority),
    auctionHouse: auctionHouse.address,
    auctionHouseFeeAccount: auctionHouse.feeAccountAddress,
    sellerTradeState,
    freeSellerTradeState,
    programAsSigner,
  };

  // Args.
  const args = {
    tradeStateBump: sellerTradeState.bump,
    freeTradeStateBump: freeSellerTradeState.bump,
    programAsSignerBump: programAsSigner.bump,
    buyerPrice: price.basisPoints,
    tokenSize: tokens.basisPoints,
  };

  // Sell Instruction.
  let sellInstruction;
  if (params.auctioneerAuthority) {
    sellInstruction = createAuctioneerSellInstruction(
      {
        ...accounts,
        auctioneerAuthority: params.auctioneerAuthority.publicKey,
        ahAuctioneerPda: findAuctioneerPda(
          auctionHouse.address,
          params.auctioneerAuthority.publicKey
        ),
      },
      args
    );
  } else {
    sellInstruction = createSellInstruction(accounts, args);
  }

  // Signers.
  const sellSigners = [seller, authority, params.auctioneerAuthority].filter(
    (input): input is Signer => !!input && isSigner(input)
  );

  // Receipt.
  // Since createPrintListingReceiptInstruction can't deserialize createAuctioneerSellInstruction due to a bug
  // Don't print Auctioneer Sell receipt for the time being.
  const shouldPrintReceipt =
    (params.printReceipt ?? true) && !params.auctioneerAuthority;
  const bookkeeper = params.bookkeeper ?? metaplex.identity();
  const receipt = findListingReceiptPda(sellerTradeState);

  return (
    TransactionBuilder.make<CreateListingBuilderContext>()
      .setContext({
        sellerTradeState,
        freeSellerTradeState,
        tokenAccount,
        metadata,
        seller: toPublicKey(seller),
        receipt: shouldPrintReceipt ? receipt : null,
        bookkeeper: shouldPrintReceipt ? bookkeeper.publicKey : null,
        price,
        tokens,
      })

      // Create Listing.
      .add({
        instruction: sellInstruction,
        signers: sellSigners,
        key: 'sell',
      })

      // Print the Listing Receipt.
      .when(shouldPrintReceipt, (builder) =>
        builder.add({
          instruction: createPrintListingReceiptInstruction(
            {
              receipt,
              bookkeeper: bookkeeper.publicKey,
              instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
            },
            { receiptBump: receipt.bump }
          ),
          signers: [bookkeeper],
          key: 'printListingReceipt',
        })
      )
  );
};
