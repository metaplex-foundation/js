import { Signer, TransactionBuilder } from '@/shared';
import {
  AccountInfo,
  Commitment,
  ConfirmOptions,
  PublicKey,
  RpcResponseAndContext,
  SendOptions,
  SignatureResult,
  Transaction,
  TransactionSignature,
} from '@solana/web3.js';
import { Driver } from '../Driver';
import { Buffer } from 'buffer';

export abstract class RpcDriver extends Driver {
  public abstract sendTransaction(
    transaction: Transaction | TransactionBuilder,
    signers?: Signer[],
    sendOptions?: SendOptions
  ): Promise<TransactionSignature>;

  public abstract confirmTransaction(
    signature: TransactionSignature,
    commitment?: Commitment
  ): Promise<RpcResponseAndContext<SignatureResult>>;

  public abstract sendAndConfirmTransaction(
    transaction: Transaction | TransactionBuilder,
    signers?: Signer[],
    confirmOptions?: ConfirmOptions
  ): Promise<TransactionSignature>;

  public abstract getAccountInfo(
    publicKey: PublicKey,
    commitment?: Commitment
  ): Promise<AccountInfo<Buffer> | null>;

  public abstract getMultipleAccountsInfo(
    publicKeys: PublicKey[],
    commitment?: Commitment
  ): Promise<Array<AccountInfo<Buffer> | null>>;
}
