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
  Amount,
  toPublicKey,
  token,
  lamports,
  isSigner,
  Pda,
} from '@/types';
import { TransactionBuilder } from '@/utils';
import {
  findAuctioneerPda,
  findAuctionHouseProgramAsSignerPda,
  findAuctionHouseTradeStatePda,
  findListingReceiptPda,
} from './pdas';
import { AuctionHouse } from './AuctionHouse';
import { findAssociatedTokenAccountPda, findMetadataPda } from '@/programs';
import { AUCTIONEER_PRICE } from './constants';

// -----------------
// Operation
// -----------------

const Key = 'CreateListingOperation' as const;
export const createListingOperation = useOperation<CreateListingOperation>(Key);
export type CreateListingOperation = Operation<
  typeof Key,
  CreateListingInput,
  CreateListingOutput
>;

export type CreateListingInput = {
  auctionHouse: AuctionHouse;
  wallet?: PublicKey | Signer; // Default: identity
  authority?: PublicKey | Signer; // Default: auctionHouse.authority
  auctioneerAuthority?: Signer; // Use Auctioneer ix when provided
  mintAccount: PublicKey; // Required for checking Metadata
  tokenAccount?: PublicKey; // Default: ATA
  price?: Amount; // Default: lamports(0)
  tokens?: Amount; // Default: token(1)
  bookkeeper?: Signer; // Default: identity
  printReceipt?: boolean; // Default: true

  // Options.
  confirmOptions?: ConfirmOptions;
};

export type CreateListingOutput = {
  response: SendAndConfirmTransactionResponse;
  receipt: Pda;
  sellerTradeState: Pda;
  freeSellerTradeState: Pda;
  tokenAccount: PublicKey;
};

// -----------------
// Handler
// -----------------

export const createListingOperationHandler: OperationHandler<CreateListingOperation> =
  {
    handle: async (operation: CreateListingOperation, metaplex: Metaplex) => {
      const builder = createListingBuilder(metaplex, operation.input);

      const response = await metaplex
        .rpc()
        .sendAndConfirmTransaction(
          builder,
          undefined,
          operation.input.confirmOptions
        );

      return {
        response,
        ...builder.getContext(),
      };
    },
  };

// -----------------
// Builder
// -----------------

export type CreateListingBuilderParams = Omit<
  CreateListingInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

export type CreateListingBuilderContext = Omit<CreateListingOutput, 'response'>;

export const createListingBuilder = (
  metaplex: Metaplex,
  params: CreateListingBuilderParams
): TransactionBuilder<CreateListingBuilderContext> => {
  // Data.
  const tokens = params.tokens ?? token(1);
  const price = params.auctioneerAuthority
    ? lamports(AUCTIONEER_PRICE)
    : params.price ?? lamports(0);

  // Accounts.
  const auctionHouse = params.auctionHouse;
  const wallet = params.wallet ?? (metaplex.identity() as Signer);
  const authority = params.authority ?? auctionHouse.authority;
  const tokenAccount =
    params.tokenAccount ??
    findAssociatedTokenAccountPda(params.mintAccount, toPublicKey(wallet));
  const sellerTradeState = findAuctionHouseTradeStatePda(
    auctionHouse.address,
    toPublicKey(wallet),
    tokenAccount,
    auctionHouse.treasuryMint,
    params.mintAccount,
    price.basisPoints,
    tokens.basisPoints
  );
  const freeSellerTradeState = findAuctionHouseTradeStatePda(
    auctionHouse.address,
    toPublicKey(wallet),
    tokenAccount,
    auctionHouse.treasuryMint,
    params.mintAccount,
    lamports(0).basisPoints,
    tokens.basisPoints
  );
  const programAsSigner = findAuctionHouseProgramAsSignerPda();
  const accounts = {
    wallet: toPublicKey(wallet),
    tokenAccount,
    metadata: findMetadataPda(params.mintAccount),
    authority: toPublicKey(authority),
    auctionHouse: auctionHouse.address,
    auctionHouseFeeAccount: auctionHouse.feeAccount,
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
  const sellSigners = [wallet, authority, params.auctioneerAuthority].filter(
    (input): input is Signer => !!input && isSigner(input)
  );

  // Receipt.
  const bookkeeper: Signer = params.bookkeeper ?? metaplex.identity();
  const receipt = findListingReceiptPda(sellerTradeState);

  return (
    TransactionBuilder.make<CreateListingBuilderContext>()
      .setContext({
        receipt,
        sellerTradeState,
        freeSellerTradeState,
        tokenAccount,
      })

      // Create Listing.
      .add({
        instruction: sellInstruction,
        signers: sellSigners,
        key: 'sell',
      })

      // Print the Listing Receipt.
      .when(params.printReceipt ?? true, (builder) =>
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
