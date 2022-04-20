import { SendTransactionError, TransactionError } from '@solana/web3.js';
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

export class FailedToSendTransactionError extends RpcError {
  constructor(cause: Error) {
    super({
      cause,
      key: 'failed_to_send_transaction',
      title: 'Failed to Send Transaction',
      problem: `The transaction could not be confirmed for the following reason.`,
      solution: 'Check the error below for more information.',
    });

    // TODO: Parse using program knowledge.
  }

  public asSendTransactionError(): SendTransactionError {
    return this.cause as SendTransactionError;
  }

  public get error() {
    return this.asSendTransactionError().message;
  }

  public get logs() {
    return this.asSendTransactionError().logs ?? [];
  }
}

export class FailedToConfirmTransactionError extends RpcError {
  public readonly response: ConfirmTransactionResponse;

  constructor(response: ConfirmTransactionResponse, cause?: Error) {
    super({
      cause,
      key: 'failed_to_confirm_transaction',
      title: 'Failed to Confirm Transaction',
      problem: `The transaction could not be confirmed for the following reason: [${response.value.err}].`,
      solution: 'Check the provided error message for more information.',
    });
    this.response = response;
  }

  public get error(): TransactionError {
    return this.response.value.err ?? 'Unknown error';
  }
}
