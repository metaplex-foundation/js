import {
  CandyMachineV2Item,
  CreateCandyMachineV2Input,
  Metaplex,
  sol,
  toBigNumber,
} from '@/index';
import { sha512 } from '@noble/hashes/sha512';
import { Buffer } from 'buffer';
import { amman } from '../../helpers';

export async function createCandyMachineV2(
  mx: Metaplex,
  input: Partial<CreateCandyMachineV2Input> & {
    items?: CandyMachineV2Item[];
  } = {}
) {
  let { candyMachine, response } = await mx
    .candyMachinesV2()
    .create({
      price: sol(1),
      sellerFeeBasisPoints: 500,
      itemsAvailable: toBigNumber(100),
      ...input,
    })
    .run();

  if (input.items) {
    await mx
      .candyMachinesV2()
      .insertItems({
        candyMachine,
        authority: mx.identity(),
        items: input.items,
      })
      .run();
    candyMachine = await mx.candyMachinesV2().refresh(candyMachine).run();
  }

  await amman.addr.addLabel('candy-machine', candyMachine.address);
  await amman.addr.addLabel('tx: create candy-machine', response.signature);

  return {
    response,
    candyMachine,
  };
}

export function create32BitsHash(
  input: Buffer | string,
  slice?: number
): number[] {
  const hash = create32BitsHashString(input, slice);

  return Buffer.from(hash, 'utf8').toJSON().data;
}

export function create32BitsHashString(
  input: Buffer | string,
  slice: number = 32
): string {
  const hash = sha512(input).slice(0, slice / 2);

  return Buffer.from(hash).toString('hex');
}
