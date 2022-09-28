import { Buffer } from 'buffer';
import {
  AccountInfo,
  Blockhash,
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
import type { Metaplex } from '@/Metaplex';
import {
  getSignerHistogram,
  Signer,
  UnparsedAccount,
  UnparsedMaybeAccount,
  isErrorWithLogs,
  Program,
  lamports,
  assertSol,
  SolAmount,
} from '@/types';
import { TransactionBuilder, zipMap } from '@/utils';
import {
  FailedToConfirmTransactionError,
  FailedToConfirmTransactionWithResponseError,
  FailedToSendTransactionError,
  MetaplexError,
  ParsedProgramError,
  UnknownProgramError,
} from '@/errors';

export type ConfirmTransactionResponse = RpcResponseAndContext<SignatureResult>;
export type SendAndConfirmTransactionResponse = {
  signature: TransactionSignature;
  confirmResponse: ConfirmTransactionResponse;
};

/**
 * @group Modules
 */
export class RpcClient {
  constructor(protected readonly metaplex: Metaplex) {}

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

    if (
      transaction.feePayer &&
      this.metaplex.identity().equals(transaction.feePayer)
    ) {
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
      return await this.metaplex.connection.sendRawTransaction(
        rawTransaction,
        sendOptions
      );
    } catch (error) {
      throw this.parseProgramError(error, transaction);
    }
  }

  async confirmTransaction(
    signature: TransactionSignature,
    commitment?: Commitment
  ): Promise<ConfirmTransactionResponse> {
    let rpcResponse: ConfirmTransactionResponse;
    try {
      rpcResponse = await this.metaplex.connection.confirmTransaction(
        signature,
        commitment
      );
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
    const signature = await this.sendTransaction(
      transaction,
      signers,
      confirmOptions
    );
    const confirmResponse = await this.confirmTransaction(
      signature,
      confirmOptions?.commitment
    );

    return { signature, confirmResponse };
  }

  async getAccount(publicKey: PublicKey, commitment?: Commitment) {
    const accountInfo = await this.metaplex.connection.getAccountInfo(
      publicKey,
      commitment
    );

    return this.getUnparsedMaybeAccount(publicKey, accountInfo);
  }

  async accountExists(publicKey: PublicKey, commitment?: Commitment) {
    const balance = await this.metaplex.connection.getBalance(
      publicKey,
      commitment
    );

    return balance > 0;
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

  async getProgramAccounts(
    programId: PublicKey,
    configOrCommitment?: GetProgramAccountsConfig | Commitment
  ): Promise<UnparsedAccount[]> {
    const accounts = await this.metaplex.connection.getProgramAccounts(
      programId,
      configOrCommitment
    );

    return accounts.map(({ pubkey, account }) => ({
      publicKey: pubkey,
      ...account,
    }));
  }

  async airdrop(
    publicKey: PublicKey,
    amount: SolAmount,
    commitment?: Commitment
  ): Promise<SendAndConfirmTransactionResponse> {
    assertSol(amount);

    const signature = await this.metaplex.connection.requestAirdrop(
      publicKey,
      amount.basisPoints.toNumber()
    );

    const confirmResponse = await this.confirmTransaction(
      signature,
      commitment
    );

    return { signature, confirmResponse };
  }

  async getBalance(
    publicKey: PublicKey,
    commitment?: Commitment
  ): Promise<SolAmount> {
    const balance = await this.metaplex.connection.getBalance(
      publicKey,
      commitment
    );

    return lamports(balance);
  }

  async getRent(bytes: number, commitment?: Commitment): Promise<SolAmount> {
    const rent =
      await this.metaplex.connection.getMinimumBalanceForRentExemption(
        bytes,
        commitment
      );

    return lamports(rent);
  }

  async getLatestBlockhash(): Promise<Blockhash> {
    return (await this.metaplex.connection.getLatestBlockhash('finalized'))
      .blockhash;
  }

  getSolanaExporerUrl(signature: string): string {
    let clusterParam = '';
    switch (this.metaplex.cluster) {
      case 'devnet':
        clusterParam = '?cluster=devnet';
        break;
      case 'testnet':
        clusterParam = '?cluster=testnet';
        break;
      case 'localnet':
      case 'custom':
        const url = encodeURIComponent(this.metaplex.connection.rpcEndpoint);
        clusterParam = `?cluster=custom&customUrl=${url}`;
        break;
    }

    return `https://explorer.solana.com/tx/${signature}${clusterParam}`;
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

  protected parseProgramError(
    error: unknown,
    transaction: Transaction
  ): MetaplexError {
    // Ensure the error as logs.
    if (!isErrorWithLogs(error)) {
      return new FailedToSendTransactionError(error as Error);
    }

    // Parse the instruction number.
    const regex = /Error processing Instruction (\d+):/;
    const instruction: string | null = error.message.match(regex)?.[1] ?? null;

    // Ensure there is an instruction number given to find the program.
    if (!instruction) {
      return new FailedToSendTransactionError(error);
    }

    // Get the program ID from the instruction in the transaction.
    const instructionNumber: number = parseInt(instruction, 10);
    const programId: PublicKey | null =
      transaction.instructions?.[instructionNumber]?.programId ?? null;

    // Ensure we were able to find a program ID for the instruction.
    if (!programId) {
      return new FailedToSendTransactionError(error);
    }

    // Find a registered program if any.
    let program: Program;
    try {
      program = this.metaplex.programs().get(programId);
    } catch (_programNotFoundError) {
      return new FailedToSendTransactionError(error);
    }

    // Ensure an error resolver exists on the program.
    if (!program.errorResolver) {
      return new UnknownProgramError(program, error);
    }

    // Finally, resolve the error.
    const resolvedError = program.errorResolver(error);

    return resolvedError
      ? new ParsedProgramError(program, resolvedError)
      : new UnknownProgramError(program, error);
  }
}
