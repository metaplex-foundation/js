import spok, { Specifications } from 'spok';
import test, { Test } from 'tape';
import { createNft, killStuckProcess, metaplex } from '../../helpers';
import { Nft } from '@/index';

killStuckProcess();

test.skip('[nftModule] it can do something', async (t: Test) => {
  // Given an existing NFT.
  const mx = await metaplex();
  const nft = await createNft(mx, {
    //
  });

  // When ...
  // Do something...
  const updatedNft = await mx.nfts().refresh(nft);

  // Then the NFT was updated accordingly.
  spok(t, updatedNft, {
    model: 'nft',
    $topic: 'Updated NFT',
  } as unknown as Specifications<Nft>);
});
