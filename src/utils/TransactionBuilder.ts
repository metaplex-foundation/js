import {
  Blockhash,
  ConfirmOptions,
  PublicKey,
  SignaturePubkeyPair,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import type { Signer } from '@/types';
import type { Metaplex } from '@/Metaplex';
import { SendAndConfirmTransactionResponse } from '..';

export type InstructionWithSigners = {
  instruction: TransactionInstruction;
  signers: Signer[];
  key?: string;
};

type TransactionOptions = {
  /** The transaction fee payer */
  feePayer?: PublicKey | null;
  /** One or more signatures */
  signatures?: Array<SignaturePubkeyPair>;
  /** A recent blockhash */
  blockhash: Blockhash;
  /** the last block chain can advance to before tx is exportd expired */
  lastValidBlockHeight: number;
};

export class TransactionBuilder<C extends object = object> {
  /** The list of all instructions and their respective signers. */
  private records: InstructionWithSigners[] = [];

  /** Options used when building the transaction. */
  private transactionOptions?: TransactionOptions;

  /** The signer to use to pay for transaction fees. */
  private feePayer: Signer | undefined = undefined;

  /** Any additional context gathered when creating the transaction builder. */
  private context: C = {} as C;

  constructor(transactionOptions?: TransactionOptions) {
    this.transactionOptions = transactionOptions;
  }

  static make<C extends object = object>(
    transactionOptions?: TransactionOptions
  ): TransactionBuilder<C> {
    return new TransactionBuilder<C>(transactionOptions);
  }

  prepend(
    ...txs: (InstructionWithSigners | TransactionBuilder)[]
  ): TransactionBuilder<C> {
    const newRecords = txs.flatMap((tx) =>
      tx instanceof TransactionBuilder ? tx.getInstructionsWithSigners() : [tx]
    );
    this.records = [...newRecords, ...this.records];

    return this;
  }

  append(
    ...txs: (InstructionWithSigners | TransactionBuilder)[]
  ): TransactionBuilder<C> {
    const newRecords = txs.flatMap((tx) =>
      tx instanceof TransactionBuilder ? tx.getInstructionsWithSigners() : [tx]
    );
    this.records = [...this.records, ...newRecords];

    return this;
  }

  add(
    ...txs: (InstructionWithSigners | TransactionBuilder)[]
  ): TransactionBuilder<C> {
    return this.append(...txs);
  }

  splitUsingKey(
    key: string,
    include: boolean = true
  ): [TransactionBuilder, TransactionBuilder] {
    const firstBuilder = new TransactionBuilder(this.transactionOptions);
    const secondBuilder = new TransactionBuilder(this.transactionOptions);
    let keyPosition = this.records.findIndex((record) => record.key === key);

    if (keyPosition > -1) {
      keyPosition += include ? 1 : 0;
      firstBuilder.add(...this.records.slice(0, keyPosition));
      firstBuilder.add(...this.records.slice(keyPosition));
    } else {
      firstBuilder.add(this);
    }

    return [firstBuilder, secondBuilder];
  }

  splitBeforeKey(key: string): [TransactionBuilder, TransactionBuilder] {
    return this.splitUsingKey(key, false);
  }

  splitAfterKey(key: string): [TransactionBuilder, TransactionBuilder] {
    return this.splitUsingKey(key, true);
  }

  getInstructionsWithSigners(): InstructionWithSigners[] {
    return this.records;
  }

  getInstructions(): TransactionInstruction[] {
    return this.records.map((record) => record.instruction);
  }

  getInstructionCount(): number {
    return this.records.length;
  }

  isEmpty(): boolean {
    return this.getInstructionCount() === 0;
  }

  getSigners(): Signer[] {
    const feePayer = this.feePayer == null ? [] : [this.feePayer];
    const signers = this.records.flatMap((record) => record.signers);

    return [...feePayer, ...signers];
  }

  setTransactionOptions(
    transactionOptions: TransactionOptions
  ): TransactionBuilder<C> {
    this.transactionOptions = transactionOptions;

    return this;
  }

  getTransactionOptions(): TransactionOptions | undefined {
    return this.transactionOptions;
  }

  setFeePayer(feePayer: Signer): TransactionBuilder<C> {
    this.feePayer = feePayer;

    return this;
  }

  getFeePayer(): PublicKey | undefined {
    return this.feePayer?.publicKey;
  }

  setContext(context: C): TransactionBuilder<C> {
    this.context = context;

    return this;
  }

  getContext(): C {
    return this.context;
  }

  when(
    condition: boolean,
    callback: (tx: TransactionBuilder<C>) => TransactionBuilder<C>
  ) {
    return condition ? callback(this) : this;
  }

  unless(
    condition: boolean,
    callback: (tx: TransactionBuilder<C>) => TransactionBuilder<C>
  ) {
    return this.when(!condition, callback);
  }

  toTransaction(): Transaction {
    const tx = new Transaction(this.getTransactionOptions());
    tx.add(...this.getInstructions());
    tx.feePayer = this.getFeePayer();

    return tx;
  }

  async sendAndConfirm(
    metaplex: Metaplex,
    confirmOptions?: ConfirmOptions
  ): Promise<{ response: SendAndConfirmTransactionResponse } & C> {
    const response = await metaplex
      .rpc()
      .sendAndConfirmTransaction(this, undefined, confirmOptions);

    return {
      response,
      ...this.getContext(),
    };
  }
}
