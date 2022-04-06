import test, { Test } from 'tape';
import spok, { Specifications } from 'spok';
import { PublicKey } from '@solana/web3.js';
import { Nft } from '@/index';
import { metaplex, spokSamePubkey } from '../../helpers';

test('it can create an NFT with minimum configuration', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();
  const nft_to_update = await mx.nfts().findNft({ mint: new PublicKey('some mint key') });
  const new_name = 'some new name';
  const new_uri = 'some new uri';

  const { nft }: { nft: Nft } = await mx.nfts().updateNft(nft_to_update, {
    name: new_name,
    uri: new_uri,
  });

  spok(t, nft, {
    $topic: 'nft-update',
    name: new_name, // Only added two update params but feel free to add more
    uri: new_uri,
  } as unknown as Specifications<Nft>);
});
