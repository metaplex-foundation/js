import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { TransactionBuilder } from '@/utils';
import { createExecuteSaleInstruction } from '@metaplex-foundation/mpl-auction-house';
import {
  useOperation,
  Operation,
  OperationHandler,
  Signer,
  toPublicKey,
  token,
  lamports,
  amount,
  SolAmount,
  SplTokenAmount,
} from '@/types';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { findAssociatedTokenAccountPda } from '../tokenModule';
import { findMetadataPda } from '../nftModule';
import { AuctionHouse } from './AuctionHouse';
import {
  findAuctionHouseBuyerEscrowPda,
  findAuctionHouseProgramAsSignerPda,
  findAuctionHouseTradeStatePda,
} from './pdas';

// -----------------
// Operation
// -----------------

const Key = 'ExecuteSaleOperation' as const;
export const executeSaleOperation = useOperation<ExecuteSaleOperation>(Key);
export type ExecuteSaleOperation = Operation<
  typeof Key,
  ExecuteSaleInput,
  ExecuteSaleOutput
>;

export type ExecuteSaleInput = {
  auctionHouse: AuctionHouse;
  buyer: PublicKey | Signer;
  seller?: PublicKey | Signer; // Default: identity
  mintAccount: PublicKey; // Required for checking Metadata
  sellerTradeState: PublicKey;
  buyerTradeState: PublicKey;
  price: SolAmount | SplTokenAmount;
  tokens?: SplTokenAmount; // Default: token(1)

  // Options.
  confirmOptions?: ConfirmOptions;
};

export type ExecuteSaleOutput = {
  response: SendAndConfirmTransactionResponse;
};

// -----------------
// Handler
// -----------------

export const executeSaleOperationHandler: OperationHandler<ExecuteSaleOperation> =
  {
    handle: async (operation: ExecuteSaleOperation, metaplex: Metaplex) =>
      executeSaleBuilder(metaplex, operation.input).sendAndConfirm(
        metaplex,
        operation.input.confirmOptions
      ),
  };

// -----------------
// Builder
// -----------------

export type ExecuteSaleBuilderParams = Omit<
  ExecuteSaleInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

export type ExecuteSaleBuilderContext = Omit<ExecuteSaleOutput, 'response'>;

export const executeSaleBuilder = (
  metaplex: Metaplex,
  params: ExecuteSaleBuilderParams
): TransactionBuilder<ExecuteSaleBuilderContext> => {
  // Data.
  const auctionHouse = params.auctionHouse;
  const tokens = params.tokens ?? token(1);
  const priceBasisPoint = params.price?.basisPoints ?? 0;
  const price = auctionHouse.isNative
    ? lamports(priceBasisPoint)
    : amount(priceBasisPoint, auctionHouse.treasuryMint.currency);

  // Accounts.
  const seller = params.seller ?? (metaplex.identity() as Signer);
  const tokenAccount = findAssociatedTokenAccountPda(
    params.mintAccount,
    toPublicKey(seller)
  );
  const buyerTokenAccount = findAssociatedTokenAccountPda(
    params.mintAccount,
    toPublicKey(params.buyer)
  );
  const metadata = findMetadataPda(params.mintAccount);
  const escrowPayment = findAuctionHouseBuyerEscrowPda(
    auctionHouse.address,
    toPublicKey(params.buyer)
  );
  const freeTradeState = findAuctionHouseTradeStatePda(
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
    buyer: toPublicKey(params.buyer),
    seller: toPublicKey(seller),
    tokenAccount,
    tokenMint: params.mintAccount,
    metadata,
    treasuryMint: auctionHouse.treasuryMint.address,
    escrowPaymentAccount: escrowPayment,
    sellerPaymentReceiptAccount: toPublicKey(seller),
    buyerReceiptTokenAccount: buyerTokenAccount,
    authority: auctionHouse.authorityAddress,
    auctionHouse: auctionHouse.address,
    auctionHouseFeeAccount: auctionHouse.feeAccountAddress,
    auctionHouseTreasury: auctionHouse.treasuryAccountAddress,
    buyerTradeState: params.buyerTradeState,
    sellerTradeState: params.sellerTradeState,
    freeTradeState,
    programAsSigner,
  };

  // Args.
  const args = {
    freeTradeStateBump: freeTradeState.bump,
    escrowPaymentBump: escrowPayment.bump,
    programAsSignerBump: programAsSigner.bump,
    buyerPrice: price.basisPoints,
    tokenSize: tokens.basisPoints,
  };

  return TransactionBuilder.make<ExecuteSaleBuilderContext>().add({
    instruction: createExecuteSaleInstruction(accounts, args),
    signers: [],
    key: params.instructionKey ?? 'executeSale',
  });
};
