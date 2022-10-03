import type { Blockstore } from 'ipfs-car/blockstore';
import type { CID } from 'multiformats';
import { CarReader } from 'nft.storage';
import * as Block from 'multiformats/block';
import { sha256 } from 'multiformats/hashes/sha2';
import * as dagPb from '@ipld/dag-pb';
import { UnixFS } from 'ipfs-unixfs';
import { BlockstoreCarReader } from './BlockstoreCarReader';

export type EncodedCar = { car: CarReader; cid: CID };
export type DagPbLink = dagPb.PBLink;
export type DagPbBlock = Block.Block<dagPb.PBNode>;

export const DEFAULT_GATEWAY_HOST = 'https://nftstorage.link';

export function toGatewayUri(
  cid: string,
  path = '',
  host: string = DEFAULT_GATEWAY_HOST
): string {
  let pathPrefix = `/ipfs/${cid}`;
  if (path) {
    pathPrefix += '/';
  }
  host = host || DEFAULT_GATEWAY_HOST;
  const base = new URL(pathPrefix, host);
  const u = new URL(path, base);
  return u.toString();
}

export function toIpfsUri(cid: string, path = ''): string {
  const u = new URL(path, `ipfs://${cid}`);
  return u.toString();
}

export async function toDagPbLink(
  node: EncodedCar,
  name: string
): Promise<DagPbLink> {
  const block = await node.car.get(node.cid);
  if (!block) {
    throw new Error(`invalid CAR: missing block for CID [${node.cid}]`);
  }
  return dagPb.createLink(name, block.bytes.byteLength, node.cid);
}

export async function toDirectoryBlock(
  links: DagPbLink[]
): Promise<DagPbBlock> {
  const data = new UnixFS({ type: 'directory' }).marshal();
  const value = dagPb.createNode(data, links);
  return Block.encode({ value, codec: dagPb, hasher: sha256 });
}

export async function toEncodedCar(
  block: DagPbBlock,
  blockstore: Blockstore
): Promise<EncodedCar> {
  await blockstore.put(block.cid, block.bytes);
  const car = new BlockstoreCarReader([block.cid], blockstore);
  const { cid } = block;

  return { car, cid };
}
