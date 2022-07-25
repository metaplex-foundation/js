import { Blockstore } from 'ipfs-car/blockstore';
import type { CID } from 'multiformats';

/**
 * An implementation of the CAR reader interface that is backed by a blockstore.
 * @see https://github.com/nftstorage/nft.storage/blob/0fc7e4e73867c437eac54f75f58a808dd4581c47/packages/client/src/bs-car-reader.js
 */
export class BlockstoreCarReader {
  _version: number;
  _roots: CID[];
  _blockstore: Blockstore;

  constructor(roots: CID[], blockstore: Blockstore, version: number = 1) {
    this._version = version;
    this._roots = roots;
    this._blockstore = blockstore;
  }

  get version() {
    return this._version;
  }

  get blockstore() {
    return this._blockstore;
  }

  async getRoots() {
    return this._roots;
  }

  has(cid: CID) {
    return this._blockstore.has(cid);
  }

  async get(cid: CID) {
    const bytes = await this._blockstore.get(cid);
    return { cid, bytes };
  }

  blocks() {
    return this._blockstore.blocks();
  }

  async *cids() {
    for await (const b of this.blocks()) {
      yield b.cid;
    }
  }
}
