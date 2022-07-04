import nacl from 'tweetnacl';
import { Buffer } from 'buffer';
import { amman } from '../../helpers';
import {
  Metaplex,
  CreateCandyMachineInput,
  sol,
  CandyMachineItem,
  toBigNumber,
} from '@/index';

export async function createCandyMachine(
  mx: Metaplex,
  input: Partial<CreateCandyMachineInput> & { items?: CandyMachineItem[] } = {}
) {
  let { candyMachine, response } = await mx
    .candyMachines()
    .create({
      price: sol(1),
      sellerFeeBasisPoints: 500,
      itemsAvailable: toBigNumber(100),
      ...input,
    })
    .run();

  if (input.items) {
    const insertItemsOutput = await mx
      .candyMachines()
      .insertItems(candyMachine, {
        authority: mx.identity(),
        items: input.items,
      })
      .run();
    candyMachine = insertItemsOutput.candyMachine;
  }

  await amman.addr.addLabel('candy-machine', candyMachine.address);
  await amman.addr.addLabel('tx: create candy-machine', response.signature);

  return {
    response,
    candyMachine,
  };
}

export function createHash(input: Buffer | string, slice?: number): number[] {
  let hash = nacl.hash(Buffer.from(input));
  hash = slice === undefined ? hash : hash.slice(0, slice);

  return Array.from(hash);
}

export function createHashString(
  input: Buffer | string,
  slice?: number
): string {
  let hash = nacl.hash(Buffer.from(input));
  hash = slice === undefined ? hash : hash.slice(0, slice);

  return Buffer.from(hash).toString('hex');
}
