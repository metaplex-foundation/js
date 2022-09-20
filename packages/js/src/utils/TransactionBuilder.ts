import {
  Blockhash,
  ConfirmOptions,
  PublicKey,
  SignaturePubkeyPair,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '..';
import type { Signer } from '@metaplex-foundation/js';
import type { Metaplex } from '@metaplex-foundation/js';

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
  private _records: InstructionWithSigners[] = [];

  /** Options used when building the transaction. */
  private _transactionOptions?: TransactionOptions;

  /** The signer to use to pay for transaction fees. */
  private _feePayer: Signer | undefined = undefined;

  /** Any additional context gathered when creating the transaction builder. */
  private _context: C = {} as C;

  constructor(transactionOptions?: TransactionOptions) {
    this._transactionOptions = transactionOptions;
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
    this._records = [...newRecords, ...this._records];

    return this;
  }

  append(
    ...txs: (InstructionWithSigners | TransactionBuilder)[]
  ): TransactionBuilder<C> {
    const newRecords = txs.flatMap((tx) =>
      tx instanceof TransactionBuilder ? tx.getInstructionsWithSigners() : [tx]
    );
    this._records = [...this._records, ...newRecords];

    return this;
  }

  add(
    ...txs: (InstructionWithSigners | TransactionBuilder)[]
  ): TransactionBuilder<C> {
    return this.append(...txs);
  }

  splitUsingKey(
    key: string,
    include = true
  ): [TransactionBuilder, TransactionBuilder] {
    const firstBuilder = new TransactionBuilder(this._transactionOptions);
    const secondBuilder = new TransactionBuilder(this._transactionOptions);
    let keyPosition = this._records.findIndex((record) => record.key === key);

    if (keyPosition > -1) {
      keyPosition += include ? 1 : 0;
      firstBuilder.add(...this._records.slice(0, keyPosition));
      firstBuilder.add(...this._records.slice(keyPosition));
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
    return this._records;
  }

  getInstructions(): TransactionInstruction[] {
    return this._records.map((record) => record.instruction);
  }

  getInstructionCount(): number {
    return this._records.length;
  }

  isEmpty(): boolean {
    return this.getInstructionCount() === 0;
  }

  getSigners(): Signer[] {
    const feePayer = this._feePayer == null ? [] : [this._feePayer];
    const signers = this._records.flatMap((record) => record.signers);

    return [...feePayer, ...signers];
  }

  setTransactionOptions(
    transactionOptions: TransactionOptions
  ): TransactionBuilder<C> {
    this._transactionOptions = transactionOptions;

    return this;
  }

  getTransactionOptions(): TransactionOptions | undefined {
    return this._transactionOptions;
  }

  setFeePayer(feePayer: Signer): TransactionBuilder<C> {
    this._feePayer = feePayer;

    return this;
  }

  getFeePayer(): PublicKey | undefined {
    return this._feePayer?.publicKey;
  }

  setContext(context: C): TransactionBuilder<C> {
    this._context = context;

    return this;
  }

  getContext(): C {
    return this._context;
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
