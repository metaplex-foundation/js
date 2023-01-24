import spok, { Specifications } from 'spok';
import test, { Test } from 'tape';
import { TokenStandard } from '@metaplex-foundation/mpl-token-metadata';
import { Keypair } from '@solana/web3.js';
import { createNft, killStuckProcess, metaplex } from '../../helpers';
import { Nft } from '@/index';

killStuckProcess();

test('[nftModule] utility delegates can lock programmable NFTs', async (t: Test) => {
  // Given an existing PNFT.
  const mx = await metaplex();
  const owner = Keypair.generate();
  const nft = await createNft(mx, {
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    tokenOwner: owner.publicKey,
  });

  // And an approved utility delegate.
  const utilityDelegate = Keypair.generate();
  await mx.nfts().delegate({
    nftOrSft: nft,
    delegate: {
      type: 'UtilityV1',
      delegate: utilityDelegate.publicKey,
      owner: owner.publicKey,
      data: { amount: 1 },
    },
  });

  // When ...
  // Do something...

  // Then the NFT was updated accordingly.
  const updatedNft = await mx.nfts().refresh(nft);
  spok(t, updatedNft, {
    model: 'nft',
    $topic: 'Updated NFT',
  } as unknown as Specifications<Nft>);
});
