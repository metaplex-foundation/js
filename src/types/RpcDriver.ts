import {
  Commitment,
  ConfirmOptions,
  GetProgramAccountsConfig,
  PublicKey,
  RpcResponseAndContext,
  SendOptions,
  SignatureResult,
  Transaction,
  TransactionSignature,
} from '@solana/web3.js';
import { Signer, UnparsedAccount, UnparsedMaybeAccount } from '@/types';
import { TransactionBuilder } from '@/utils';
import { Driver } from './Driver';

export type ConfirmTransactionResponse = RpcResponseAndContext<SignatureResult>;
export type SendAndConfirmTransactionResponse = {
  signature: TransactionSignature;
  confirmResponse: ConfirmTransactionResponse;
};

export abstract class RpcDriver extends Driver {
  public abstract sendTransaction(
    transaction: Transaction | TransactionBuilder,
    signers?: Signer[],
    sendOptions?: SendOptions
  ): Promise<TransactionSignature>;

  public abstract confirmTransaction(
    signature: TransactionSignature,
    commitment?: Commitment
  ): Promise<ConfirmTransactionResponse>;

  public abstract sendAndConfirmTransaction(
    transaction: Transaction | TransactionBuilder,
    signers?: Signer[],
    confirmOptions?: ConfirmOptions
  ): Promise<SendAndConfirmTransactionResponse>;

  public abstract getAccount(
    publicKey: PublicKey,
    commitment?: Commitment
  ): Promise<UnparsedMaybeAccount>;

  public abstract getMultipleAccounts(
    publicKeys: PublicKey[],
    commitment?: Commitment
  ): Promise<UnparsedMaybeAccount[]>;

  public abstract getProgramAccounts(
    programId: PublicKey,
    configOrCommitment?: GetProgramAccountsConfig | Commitment
  ): Promise<UnparsedAccount[]>;
}
