import {
  Blockhash,
  PublicKey,
  SignaturePubkeyPair,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { Signer } from '@/types';

export interface InstructionWithSigners {
  key?: string;
  instruction: TransactionInstruction;
  signers: Signer[];
}

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

export class TransactionBuilder {
  /** The list of all instructions and their respective signers. */
  private records: InstructionWithSigners[] = [];

  /** Options used when building the transaction. */
  private transactionOptions?: TransactionOptions;

  /** The signer to use to pay for transaction fees. */
  private feePayer: Signer | undefined = undefined;

  constructor(transactionOptions?: TransactionOptions) {
    this.transactionOptions = transactionOptions;
  }

  static make(transactionOptions?: TransactionOptions) {
    return new TransactionBuilder(transactionOptions);
  }

  prepend(
    ...txs: (InstructionWithSigners | TransactionBuilder)[]
  ): TransactionBuilder {
    const newRecords = txs.flatMap((tx) =>
      tx instanceof TransactionBuilder ? tx.getInstructionsWithSigners() : [tx]
    );
    this.records = [...newRecords, ...this.records];

    return this;
  }

  append(
    ...txs: (InstructionWithSigners | TransactionBuilder)[]
  ): TransactionBuilder {
    const newRecords = txs.flatMap((tx) =>
      tx instanceof TransactionBuilder ? tx.getInstructionsWithSigners() : [tx]
    );
    this.records = [...this.records, ...newRecords];

    return this;
  }

  add(
    ...txs: (InstructionWithSigners | TransactionBuilder)[]
  ): TransactionBuilder {
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

  getSigners(): Signer[] {
    const feePayer = this.feePayer == null ? [] : [this.feePayer];
    const signers = this.records.flatMap((record) => record.signers);

    return [...feePayer, ...signers];
  }

  setTransactionOptions(
    transactionOptions: TransactionOptions
  ): TransactionBuilder {
    this.transactionOptions = transactionOptions;

    return this;
  }

  getTransactionOptions(): TransactionOptions | undefined {
    return this.transactionOptions;
  }

  setFeePayer(feePayer: Signer): TransactionBuilder {
    this.feePayer = feePayer;

    return this;
  }

  getFeePayer(): PublicKey | undefined {
    return this.feePayer?.publicKey;
  }

  when(
    condition: boolean,
    callback: (tx: TransactionBuilder) => TransactionBuilder
  ) {
    return condition ? callback(this) : this;
  }

  unless(
    condition: boolean,
    callback: (tx: TransactionBuilder) => TransactionBuilder
  ) {
    return this.when(!condition, callback);
  }

  toTransaction(): Transaction {
    const tx = new Transaction(this.getTransactionOptions());
    tx.add(...this.getInstructions());
    tx.feePayer = this.getFeePayer();

    return tx;
  }
}
