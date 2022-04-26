import {
  AccountInfo,
  Blockhash,
  Commitment,
  ConfirmOptions,
  PublicKey,
  SendOptions,
  Transaction,
  TransactionSignature,
} from '@solana/web3.js';
import { getSignerHistogram, Signer, TransactionBuilder, UnparsedMaybeAccount } from '@/shared';
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
import { zipMap } from '@/utils';
import { Buffer } from 'buffer';

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

    if (transaction.feePayer && this.metaplex.identity().equals(transaction.feePayer)) {
      signers = [this.metaplex.identity(), ...signers];
    }

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
    let rpcResponse: ConfirmTransactionResponse;
    try {
      rpcResponse = await this.metaplex.connection.confirmTransaction(signature, commitment);
    } catch (error) {
      throw new FailedToConfirmTransactionError(error as Error);
    }

    if (rpcResponse.value.err) {
      throw new FailedToConfirmTransactionWithResponseError(rpcResponse);
    }

    return rpcResponse;
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

  async getAccount(publicKey: PublicKey, commitment?: Commitment) {
    const accountInfo = await this.metaplex.connection.getAccountInfo(publicKey, commitment);

    return this.getUnparsedMaybeAccount(publicKey, accountInfo);
  }

  async getMultipleAccounts(publicKeys: PublicKey[], commitment?: Commitment) {
    const accountInfos = await this.metaplex.connection.getMultipleAccountsInfo(
      publicKeys,
      commitment
    );

    return zipMap(publicKeys, accountInfos, (publicKey, accountInfo) => {
      return this.getUnparsedMaybeAccount(publicKey, accountInfo);
    });
  }

  protected async getLatestBlockhash(): Promise<Blockhash> {
    return (await this.metaplex.connection.getLatestBlockhash('finalized')).blockhash;
  }

  protected getDefaultFeePayer(): PublicKey | undefined {
    const identity = this.metaplex.identity().publicKey;

    return identity.equals(PublicKey.default) ? undefined : identity;
  }

  protected getUnparsedMaybeAccount(
    publicKey: PublicKey,
    accountInfo: AccountInfo<Buffer> | null
  ): UnparsedMaybeAccount {
    if (!accountInfo) {
      return { publicKey, exists: false };
    }

    return { publicKey, exists: true, ...accountInfo };
  }
}
