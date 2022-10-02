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
    await mx
      .candyMachines()
      .insertItems({
        candyMachine,
        authority: mx.identity(),
        items: input.items,
      })
      .run();
    candyMachine = await mx.candyMachines().refresh(candyMachine).run();
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
  const hash = nacl.hash(Buffer.from(input)).slice(0, slice / 2);

  return Buffer.from(hash).toString('hex');
}
