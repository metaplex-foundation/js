import { CreateCandyGuardInput, Metaplex } from '@/index';
import nacl from 'tweetnacl';

export const createCandyGuard = async (
  metaplex: Metaplex,
  input?: Partial<CreateCandyGuardInput>
) => {
  const { candyGuard } = await metaplex
    .candyMachines()
    .createCandyGuard({ guards: {}, ...input })
    .run();

  return candyGuard;
};

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
