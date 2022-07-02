import nacl from 'tweetnacl';
import { Buffer } from 'buffer';
import { amman } from '../../helpers';
import { Metaplex, CreateCandyMachineInput, sol } from '@/index';

export async function createCandyMachine(
  mx: Metaplex,
  input: Partial<CreateCandyMachineInput>
) {
  const { candyMachine, response } = await mx
    .candyMachines()
    .create({
      price: sol(1),
      sellerFeeBasisPoints: 500,
      itemsAvailable: 100,
      ...input,
    })
    .run();

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
