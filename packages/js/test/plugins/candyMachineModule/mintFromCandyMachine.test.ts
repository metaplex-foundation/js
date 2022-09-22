import { CandyMachine, Nft, toBigNumber } from '@/index';
import { TokenStandard } from '@metaplex-foundation/mpl-token-metadata';
import spok, { Specifications } from 'spok';
import test from 'tape';
import {
  killStuckProcess,
  metaplex,
  spokSameBignum,
  spokSamePubkey,
} from '../../helpers';
import { createCandyMachine } from './helpers';

killStuckProcess();

test('[candyMachineModule] it can mint from candy machine', async (t) => {
  // Given an existing Candy Machine with 2 items.
  const mx = await metaplex();
  const candyMachine = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(2),
    symbol: 'CANDY',
    sellerFeeBasisPoints: 123,
    items: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
  });

  // When we mint an NFT from the candy machine.
  const { nft } = await mx.candyMachines().mint({ candyMachine }).run();
  const updatedCandyMachine = await mx
    .candyMachines()
    .refresh(candyMachine)
    .run();

  // Then an NFT was created with the right data.
  spok(t, nft, {
    $topic: 'Minted NFT',
    model: 'nft',
    name: 'Degen #1',
    symbol: 'CANDY',
    uri: 'https://example.com/degen/1',
    sellerFeeBasisPoints: 123,
    tokenStandard: TokenStandard.NonFungible,
    isMutable: true,
    primarySaleHappened: true,
    updateAuthorityAddress: spokSamePubkey(candyMachine.authorityAddress),
    creators: [
      {
        address: spokSamePubkey(
          findCandyMachineCreatorPda(candyMachine.address)
        ),
        verified: true,
        share: 0,
      },
      {
        address: spokSamePubkey(mx.identity().publicKey),
        verified: false,
        share: 100,
      },
    ],
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
