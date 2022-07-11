import test from 'tape';
import { killStuckProcess, metaplex, spokSameBignum } from '../../helpers';
import { createCandyMachine } from './helpers';
import { CandyMachine, Nft, toBigNumber } from '@/index';
import spok, { Specifications } from 'spok';

killStuckProcess();

test.only('[candyMachineModule] it can mint from candy machine', async (t) => {
  // Given an existing Candy Machine with 2 items.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(2),
    symbol: 'CANDY',
    sellerFeeBasisPoints: 123,
    items: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
  });

  // When we mint an NFT from the candy machine.
  const { nft, candyMachine: updatedCandyMachine } = await mx
    .candyMachines()
    .mint(candyMachine)
    .run();

  // Then an NFT was created with the right data.
  console.log(nft);
  spok(t, nft, {
    $topic: 'Minted NFT',
    model: 'nft',
    name: 'Degen #1',
    symbol: 'CANDY',
    uri: 'https://example.com/degen/1',
    sellerFeeBasisPoints: 123,
    edition: {
      model: 'nftEdition',
      isOriginal: true,
      supply: spokSameBignum(toBigNumber(0)),
      maxSupply: spokSameBignum(toBigNumber(0)),
    },
  } as Specifications<Nft>);

  // And the Candy Machine data was updated.
  spok(t, updatedCandyMachine, {
    $topic: 'Update Candy Machine',
    itemsAvailable: spokSameBignum(toBigNumber(2)),
    itemsMinted: spokSameBignum(toBigNumber(1)),
    itemsRemaining: spokSameBignum(toBigNumber(1)),
  } as Specifications<CandyMachine>);
});
