import { getSignerHistogram, Signer, TransactionBuilder } from '@/shared';
import {
  Commitment,
  ConfirmOptions,
  PublicKey,
  RpcResponseAndContext,
  SendOptions,
  SendTransactionError,
  SignatureResult,
  Transaction,
  TransactionError,
  TransactionSignature,
} from '@solana/web3.js';
import { RpcDriver } from './RpcDriver';

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

    const { keypairs, identities } = getSignerHistogram(signers);

    for (let i = 0; i < identities.length; i++) {
      if (!identities[i].is(this.metaplex.identity())) {
        await identities[i].signTransaction(transaction);
      }
    }

    return this.metaplex.identity().sendTransaction(transaction, keypairs, sendOptions);
  }

  async confirmTransaction(
    signature: TransactionSignature,
    commitment?: Commitment
  ): Promise<RpcResponseAndContext<SignatureResult>> {
    const rpcResponse: RpcResponseAndContext<SignatureResult> =
      await this.metaplex.connection.confirmTransaction(signature, commitment);
    let transaction_error: TransactionError | null = rpcResponse.value.err;
    if (transaction_error) {
      // TODO: Custom errors.
      throw new SendTransactionError(
        `Transaction ${signature} failed (${JSON.stringify(transaction_error)})`,
        [transaction_error.toString()]
      );
    }

    return rpcResponse;
  }

  async sendAndConfirmTransaction(
    transaction: Transaction | TransactionBuilder,
    signers?: Signer[],
    confirmOptions?: ConfirmOptions
  ): Promise<TransactionSignature> {
    const signature = await this.sendTransaction(transaction, signers, confirmOptions);
    await this.confirmTransaction(signature, confirmOptions?.commitment);

    return signature;
  }

  getAccountInfo(publicKey: PublicKey, commitment?: Commitment) {
    return this.metaplex.connection.getAccountInfo(publicKey, commitment);
  }

  getMultipleAccountsInfo(publicKeys: PublicKey[], commitment?: Commitment) {
    return this.metaplex.connection.getMultipleAccountsInfo(publicKeys, commitment);
  }
}
