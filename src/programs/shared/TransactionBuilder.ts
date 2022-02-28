import { Signer as Web3Signer, Transaction, TransactionCtorFields, TransactionInstruction } from "@solana/web3.js";
import { IdentityDriver } from "@/drivers";
import { Signer } from "@/utils";

export interface TransactionBuilderRecord {
  key?: string;
  instruction: TransactionInstruction;
  signers: Signer[];
}

export interface SignerHistogram {
  all: Signer[];
  keypairs: Web3Signer[];
  identities: IdentityDriver[];
}

export class TransactionBuilder {

  /** The list of all instructions and their respective signers. */
  private records: TransactionBuilderRecord[] = [];

  /** Options used when building the transaction. */
  private transactionOptions: TransactionCtorFields;

  constructor(transactionOptions: TransactionCtorFields = {}) {
    this.transactionOptions = transactionOptions;
  }

  static make(transactionOptions: TransactionCtorFields = {}) {
    return new TransactionBuilder(transactionOptions);
  }

  prepend(...txs: (TransactionBuilderRecord | TransactionBuilder)[]): TransactionBuilder {
    const newRecords = txs.flatMap(tx => tx instanceof TransactionBuilder ? tx.getRecords() : [tx]);
    this.records = [...newRecords, ...this.records];

    return this;
  }

  append(...txs: (TransactionBuilderRecord | TransactionBuilder)[]): TransactionBuilder {
    const newRecords = txs.flatMap(tx => tx instanceof TransactionBuilder ? tx.getRecords() : [tx]);
    this.records = [...this.records, ...newRecords];

    return this;
  }

  add(...txs: (TransactionBuilderRecord | TransactionBuilder)[]): TransactionBuilder {
    return this.append(...txs);
  }

  splitUsingKey(key: string, include: boolean = true): [TransactionBuilder, TransactionBuilder] {
    const firstBuilder = new TransactionBuilder(this.transactionOptions);
    const secondBuilder = new TransactionBuilder(this.transactionOptions);
    let keyPosition = this.records.findIndex(record => record.key === key)

    if (keyPosition > -1) {
      keyPosition += include ? 1 : 0; 
      firstBuilder.add(...this.records.slice(0, keyPosition))
      firstBuilder.add(...this.records.slice(keyPosition))
    } else {
      firstBuilder.add(this)
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

  getSigners(): SignerHistogram {
    return this.records
      .flatMap(record => record.signers)
      .reduce((signers: SignerHistogram, signer: Signer) => {
        const duplicateIndex = signers.all.findIndex(({ publicKey }) => publicKey.equals(signer.publicKey));
        const duplicate = signers.all[duplicateIndex] ?? null;
        const duplicateIsIdentity = duplicate ? !('secretKey' in duplicate) : false;
        const signerIsIdentity = !('secretKey' in signer);

        if (! duplicate) {
          signers.all.push(signer);
          signerIsIdentity 
            ? signers.identities.push(signer)
            : signers.keypairs.push(signer);
        } else if (duplicateIsIdentity && !signerIsIdentity) {
          // Prefer keypair than identity signer as it requires less user interactions.
          const duplicateKeypairIndex = signers.keypairs.findIndex(({ publicKey }) => publicKey.equals(signer.publicKey));
          delete signers.all[duplicateIndex];
          delete signers.keypairs[duplicateKeypairIndex];
          signers.all.push(signer);
          signers.keypairs.push(signer);
        }

        return signers
      }, { all: [], keypairs: [], identities: [] });
  }

  getKeypairSigners(): Web3Signer[] {
    return this.getSigners().keypairs;
  }

  getIdentitySigners(): IdentityDriver[] {
    return this.getSigners().identities;
  }

  setTransactionOptions(transactionOptions: TransactionCtorFields): TransactionBuilder {
    this.transactionOptions = transactionOptions;

    return this;
  }

  getTransactionOptions() {
    return this.transactionOptions;
  }

  when(condition: boolean, callback: (tx: TransactionBuilder) => TransactionBuilder) {
    return condition ? callback(this) : this;
  }

  unless(condition: boolean, callback: (tx: TransactionBuilder) => TransactionBuilder) {
    return this.when(!condition, callback);
  }

  toTransaction(): Transaction {
    const tx = new Transaction(this.getTransactionOptions());
    tx.add(...this.getInstructions());

    return tx;
  }
}
