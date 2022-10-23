import {
  Metaplex as MetaplexBase,
  MetaplexOptions,
} from '@metaplex-foundation/js-core';
import { Connection } from '@solana/web3.js';
import { auctionHouseModule } from '@metaplex-foundation/js-plugin-auction-house-module';

export class MetaplexJS {
  static make(connection: Connection, options: MetaplexOptions = {}) {
    const mx = new MetaplexBase(connection, options);
    mx.use(auctionHouseModule());
    return mx;
  }
}
