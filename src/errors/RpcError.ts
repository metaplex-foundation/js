import { TransactionError } from '@solana/web3.js';
import { ConfirmTransactionResponse } from '../drivers/rpc/RpcDriver';
import { MetaplexError, MetaplexErrorInputWithoutSource } from './MetaplexError';

export class RpcError extends MetaplexError {
  constructor(input: MetaplexErrorInputWithoutSource) {
    super({
      ...input,
      key: `rpc.${input.key}`,
      source: 'rpc',
    });
  }
}

export class ConfirmTransactionFailedError extends RpcError {
  public readonly response: ConfirmTransactionResponse;

  constructor(response: ConfirmTransactionResponse, cause?: Error) {
    super({
      cause,
      key: 'confirm_transaction_failed',
      title: 'Confirm Transaction Failed',
      problem: `The transaction could not be confirmed for the following reason: [${response.value.err}].`,
      solution: 'Check the provided error message for more information.',
    });
    this.response = response;
  }

  public get error() : TransactionError {
    return this.response.value.err ?? 'Unknown error';
  }
}
