import {
  CandyMachineItem,
  CreateCandyGuardInput,
  CreateCandyMachineInput,
  isSigner,
  Metaplex,
  toBigNumber,
} from '@/index';
import nacl from 'tweetnacl';
import { createCollectionNft } from '../../helpers';

export const createCandyMachine = async (
  metaplex: Metaplex,
  input?: Partial<CreateCandyMachineInput> & {
    items?: Pick<CandyMachineItem, 'name' | 'uri'>[];
  }
) => {
  let collection;
  if (input?.collection) {
    collection = input.collection;
  } else {
    const nft = await createCollectionNft(metaplex);
    collection = { address: nft.address, updateAuthority: metaplex.identity() };
  }

  let { candyMachine } = await metaplex
    .candyMachines()
    .create({
      collection,
      sellerFeeBasisPoints: 200,
      itemsAvailable: toBigNumber(1000),
      ...input,
    })
    .run();

  if (input?.items) {
    await metaplex
      .candyMachines()
      .insertItems({
        candyMachine,
        authority:
          input.authority && isSigner(input.authority)
            ? input.authority
            : metaplex.identity(),
        items: input.items,
      })
      .run();
    candyMachine = await metaplex.candyMachines().refresh(candyMachine).run();
  }

  return { candyMachine, collection };
};

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
