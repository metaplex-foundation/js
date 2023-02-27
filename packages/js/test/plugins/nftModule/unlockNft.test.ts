import {
  TokenRecord,
  TokenStandard,
  TokenState,
} from '@metaplex-foundation/mpl-token-metadata';
import { Keypair } from '@solana/web3.js';
import test, { Test } from 'tape';
import { createNft, killStuckProcess, metaplex } from '../../helpers';

killStuckProcess();

test('[nftModule] utility delegates can unlock programmable NFTs', async (t: Test) => {
  // Given an existing PNFT.
  const mx = await metaplex();
  const nftOwner = Keypair.generate();
  const nft = await createNft(mx, {
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    tokenOwner: nftOwner.publicKey,
  });

  // And an approved utility delegate.
  const utilityDelegate = Keypair.generate();
  await mx.nfts().delegate({
    nftOrSft: nft,
    authority: nftOwner,
    delegate: {
      type: 'UtilityV1',
      delegate: utilityDelegate.publicKey,
      owner: nftOwner.publicKey,
      data: { amount: 1 },
    },
  });

  // And the PNFT is locked.
  await mx.nfts().lock({
    nftOrSft: nft,
    authority: {
      __kind: 'tokenDelegate',
      type: 'UtilityV1',
      delegate: utilityDelegate,
      owner: nftOwner.publicKey,
    },
  });
  const tokenRecord = mx.nfts().pdas().tokenRecord({
    mint: nft.address,
    token: nft.token.address,
  });
  let tokenRecordAccount = await TokenRecord.fromAccountAddress(
    mx.connection,
    tokenRecord
  );
  t.equal(tokenRecordAccount.state, TokenState.Locked);

  // When the utility delegate unlocks the PNFT.
  await mx.nfts().unlock({
    nftOrSft: nft,
    authority: {
      __kind: 'tokenDelegate',
      type: 'UtilityV1',
      delegate: utilityDelegate,
      owner: nftOwner.publicKey,
    },
  });

  // Then the PNFT has been unlocked.
  tokenRecordAccount = await TokenRecord.fromAccountAddress(
    mx.connection,
    tokenRecord
  );
  t.equal(tokenRecordAccount.state, TokenState.Unlocked);
});
