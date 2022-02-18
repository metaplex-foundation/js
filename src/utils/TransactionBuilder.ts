import { Connection, SendOptions, Signer, Transaction, TransactionCtorFields, TransactionInstruction } from "@solana/web3.js";

export interface TransactionBuilderRecord {
  key?: string,
  instruction: TransactionInstruction,
  signers: Signer[],
}

export class TransactionBuilder {

  /** The list of all instructions and their respective signers. */
  private records: TransactionBuilderRecord[] = [];

  /** Options used when building the transaction. */
  private transactionOptions: TransactionCtorFields;

  constructor(transactionOptions: TransactionCtorFields = {}) {
    this.transactionOptions = transactionOptions;
  }

  prepend(instruction: TransactionInstruction, signers: Signer[] = [], key?: string): TransactionBuilder {
    this.records.unshift({ key, instruction, signers });

    return this;
  }

  append(instruction: TransactionInstruction, signers: Signer[] = [], key?: string): TransactionBuilder {
    this.records.push({ key, instruction, signers });

    return this;
  }

  add(instruction: TransactionInstruction, signers: Signer[] = [], key?: string): TransactionBuilder {
    return this.append(instruction, signers, key);
  }

  addRecords(...records: TransactionBuilderRecord[]): TransactionBuilder {
    return records.reduce((builder: TransactionBuilder, { instruction, signers, key }) => {
      return builder.add(instruction, signers, key);
    }, this)
  }

  merge(that: TransactionBuilder): TransactionBuilder {
    return this.addRecords(...that.getRecords());
  }

  splitUsingKey(key: string, include: boolean = true): [TransactionBuilder, TransactionBuilder] {
    const firstBuilder = new TransactionBuilder(this.transactionOptions);
    const secondBuilder = new TransactionBuilder(this.transactionOptions);
    let keyPosition = this.records.findIndex(record => record.key === key)

    if (keyPosition > -1) {
      keyPosition += include ? 1 : 0; 
      firstBuilder.addRecords(...this.records.slice(0, keyPosition))
      firstBuilder.addRecords(...this.records.slice(keyPosition))
    } else {
      firstBuilder.merge(this)
    }

    return [firstBuilder, secondBuilder];
  }

  splitBeforeKey(key: string): [TransactionBuilder, TransactionBuilder] {
    return this.splitUsingKey(key, false);
  }

  splitAfterKey(key: string): [TransactionBuilder, TransactionBuilder] {
    return this.splitUsingKey(key, true);
  }

  getRecords(): TransactionBuilderRecord[] {
    return this.records;
  }

  getInstructions(): TransactionInstruction[] {
    return this.records.map(record => record.instruction);
  }

  getSigners(): Signer[] {
    return this.records
      .flatMap(record => record.signers)
      .reduce((signers: Signer[], signer: Signer) => {
        if (! signers.some(({ publicKey }) => publicKey.equals(signer.publicKey))) {
          signers.push(signer)
        }
        return signers
      }, []);
  }

  setTransactionOptions(transactionOptions: TransactionCtorFields): TransactionBuilder {
    this.transactionOptions = transactionOptions;

    return this;
  }

  getTransactionOptions() {
    return this.transactionOptions;
  }

  toTransaction(): Transaction {
    const tx = new Transaction(this.getTransactionOptions());
    tx.add(...this.getInstructions());

    return tx;
  }

  async sendTransaction(connection: Connection, sendOptions: SendOptions = {}): Promise<string> {
    return connection.sendTransaction(this.toTransaction(), this.getSigners(), sendOptions)
  }
}
