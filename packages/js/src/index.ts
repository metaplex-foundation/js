import {
  Metaplex as MetaplexBase,
  MetaplexOptions,
} from '@metaplex-foundation/js-core';
import { Connection } from '@solana/web3.js';

export class MetaplexJS {
  static make(connection: Connection, options: MetaplexOptions = {}) {
    return new MetaplexBase(connection, options);
  }
}
