import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { IdentityDriver } from '../../types/IdentityDriver';
import { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types/MetaplexPluginPlugin';
import { KeypairSigner } from '@/types';

export const keypairIdentity = (keypair: Keypair): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.setIdentityDriver(new KeypairIdentityDriver(metaplex, keypair));
  },
});

export class KeypairIdentityDriver extends IdentityDriver implements KeypairSigner {
  public readonly keypair: Keypair;
  public readonly publicKey: PublicKey;
  public readonly secretKey: Uint8Array;

  constructor(metaplex: Metaplex, keypair: Keypair) {
    super(metaplex);
    this.keypair = keypair;
    this.publicKey = keypair.publicKey;
    this.secretKey = keypair.secretKey;
  }

  public async signMessage(message: Uint8Array): Promise<Uint8Array> {
    return nacl.sign.detached(message, this.secretKey);
  }

  public async signTransaction(transaction: Transaction): Promise<Transaction> {
    // TODO: Handle Error: Transaction recentBlockhash required.

    transaction.partialSign(this.keypair);

    return transaction;
  }

  public async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    return Promise.all(transactions.map((transaction) => this.signTransaction(transaction)));
  }
}
