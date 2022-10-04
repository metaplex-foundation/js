import {
  Blockhash,
  RpcResponseAndContext,
  SignatureResult,
  TransactionSignature,
} from '@solana/web3.js';

export type ConfirmTransactionResponse = RpcResponseAndContext<SignatureResult>;
export type SendAndConfirmTransactionResponse = {
  signature: TransactionSignature;
  confirmResponse: ConfirmTransactionResponse;
  blockhash: Blockhash;
  lastValidBlockHeight: number;
};
