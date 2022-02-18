import { Connection, SendOptions, Signer, Transaction, TransactionCtorFields, TransactionInstruction } from "@solana/web3.js";

export interface TransactionBuilderRecord {
  key?: string,
  instruction: TransactionInstruction,
  signers: Signer[],
}

export class TransactionBuilder {
  private records: TransactionBuilderRecord[] = [];

  prepend(instruction: TransactionInstruction, signers: Signer[] = [], key?: string) {
    this.records.unshift({ key, instruction, signers });

    return this;
  }

  append(instruction: TransactionInstruction, signers: Signer[] = [], key?: string) {
    this.records.push({ key, instruction, signers });

    return this;
  }

  add(instruction: TransactionInstruction, signers: Signer[] = [], key?: string) {
    return this.append(instruction, signers, key);
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

  toTransaction(options: TransactionCtorFields): Transaction {
    const tx = new Transaction(options);
    tx.add(...this.getInstructions());

    return tx;
  }

  async sendTransaction(connection: Connection, txOptions: TransactionCtorFields = {}, sendOptions?: SendOptions): Promise<string> {
    const tx = this.toTransaction(txOptions);

    return connection.sendTransaction(tx, this.getSigners(), sendOptions)
  }
}
