import type { GenericAbortSignal } from './GenericAbortSignal';
import type {
  Blockhash,
  SerializedTransaction,
  TransactionError,
  TransactionSignature,
} from './Transaction';

export interface RpcInterface {
  call<Result, Params extends Array<any> = Array<any>>(
    method: string,
    params?: Params,
    options?: RpcOptions
  ): Promise<Result>;
  supports(method: string): boolean;
  sendTransaction(
    serializedTransaction: SerializedTransaction
  ): Promise<TransactionSignature>;
  confirmTransaction(
    signature: TransactionSignature,
    blockhashWithExpiryBlockHeight: BlockhashWithExpiryBlockHeight,
    commitment?: Commitment
  ): Promise<RpcConfirmResult>;
  sendAndConfirmTransaction(
    serializedTransaction: SerializedTransaction
  ): Promise<{
    signature: TransactionSignature;
    result: RpcConfirmResult;
  }>;
}

export type Commitment = 'processed' | 'confirmed' | 'finalized';
export type BlockhashWithExpiryBlockHeight = {
  blockhash: Blockhash;
  lastValidBlockHeight: number;
};

export type RpcResultWithContext<Value> = {
  context: { slot: number };
  value: Value;
};

export type RpcOptions = {
  id?: string;
  signal?: GenericAbortSignal;
};

export type RpcConfirmResult = RpcResultWithContext<{
  err: TransactionError | null;
}>;
