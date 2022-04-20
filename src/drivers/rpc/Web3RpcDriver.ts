import {
  Blockhash,
  Commitment,
  ConfirmOptions,
  PublicKey,
  SendOptions,
  Transaction,
  TransactionSignature,
} from '@solana/web3.js';
import { getSignerHistogram, Signer, TransactionBuilder } from '@/shared';
import {
  RpcDriver,
  ConfirmTransactionResponse,
  SendAndConfirmTransactionResponse,
} from './RpcDriver';
import {
  FailedToConfirmTransactionError,
  FailedToConfirmTransactionWithResponseError,
  FailedToSendTransactionError,
} from '@/errors';

export class Web3RpcDriver extends RpcDriver {
  async sendTransaction(
    transaction: Transaction | TransactionBuilder,
    signers: Signer[] = [],
    sendOptions: SendOptions = {}
  ): Promise<TransactionSignature> {
    if (transaction instanceof TransactionBuilder) {
      signers = [...transaction.getSigners(), ...signers];
      transaction = transaction.toTransaction();
    }

    transaction.feePayer ??= this.getDefaultFeePayer();
    transaction.recentBlockhash ??= await this.getLatestBlockhash();

    signers = [this.metaplex.identity(), ...signers];
    const { keypairs, identities } = getSignerHistogram(signers);

    if (keypairs.length > 0) {
      transaction.partialSign(...keypairs);
    }

    for (let i = 0; i < identities.length; i++) {
      await identities[i].signTransaction(transaction);
    }

    const rawTransaction = transaction.serialize();

    try {
      return await this.metaplex.connection.sendRawTransaction(rawTransaction, sendOptions);
    } catch (error) {
      // TODO: Parse using program knowledge when possible.
      throw new FailedToSendTransactionError(error as Error);
    }
  }

  async confirmTransaction(
    signature: TransactionSignature,
    commitment?: Commitment
  ): Promise<ConfirmTransactionResponse> {
    try {
      const rpcResponse: ConfirmTransactionResponse =
        await this.metaplex.connection.confirmTransaction(signature, commitment);

      if (rpcResponse.value.err) {
        throw new FailedToConfirmTransactionWithResponseError(rpcResponse);
      }

      return rpcResponse;
    } catch (error) {
      throw new FailedToConfirmTransactionError(error as Error);
    }
  }

  async sendAndConfirmTransaction(
    transaction: Transaction | TransactionBuilder,
    signers?: Signer[],
    confirmOptions?: ConfirmOptions
  ): Promise<SendAndConfirmTransactionResponse> {
    const signature = await this.sendTransaction(transaction, signers, confirmOptions);
    const confirmResponse = await this.confirmTransaction(signature, confirmOptions?.commitment);

    return { signature, confirmResponse };
  }

  getAccountInfo(publicKey: PublicKey, commitment?: Commitment) {
    return this.metaplex.connection.getAccountInfo(publicKey, commitment);
  }

  getMultipleAccountsInfo(publicKeys: PublicKey[], commitment?: Commitment) {
    return this.metaplex.connection.getMultipleAccountsInfo(publicKeys, commitment);
  }

  protected async getLatestBlockhash(): Promise<Blockhash> {
    return (await this.metaplex.connection.getLatestBlockhash('finalized')).blockhash;
  }

  protected getDefaultFeePayer(): PublicKey | undefined {
    const identity = this.metaplex.identity().publicKey;

    return identity.equals(PublicKey.default) ? undefined : identity;
  }
}
