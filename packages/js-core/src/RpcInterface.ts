import { GenericAbortSignal } from './GenericAbortSignal';

export interface RpcInterface {
  call<ResponseValue, Params extends Array<any> = Array<any>>(
    method: string,
    params?: Params,
    options?: RpcOptions
  ): Promise<RpcResult<ResponseValue>>;
  supports(method: string): boolean;
  // sendTransaction(SerializedTransaction): Promise<TransactionSignature>;
  // confirmTransaction(TransactionSignature): Promise<T>;
  // sendAndConfirmTransaction(SerializedTransaction): Promise<T>;
}

export type RpcResult<Value> = {
  context: { slot: number };
  value: Value;
};

export type RpcOptions = {
  id?: string;
  signal?: GenericAbortSignal;
};
