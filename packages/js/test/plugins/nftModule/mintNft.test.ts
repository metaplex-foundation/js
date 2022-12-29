import spok, { Specifications } from 'spok';
import test, { Test } from 'tape';
import { Keypair } from '@solana/web3.js';
import {
  createSft,
  killStuckProcess,
  metaplex,
  spokSameAmount,
} from '../../helpers';
import { Sft, token } from '@/index';

killStuckProcess();

test.only('[nftModule] it can mint tokens from an SFT', async (t: Test) => {
  // Given an existing SFT with no supply.
  const mx = await metaplex();
  const sft = await createSft(mx);
  t.equal(sft.mint.supply.basisPoints.toNumber(), 0, 'SFT has no supply');

  // When we mint 42 tokens to a new owner.
  const toOwner = Keypair.generate().publicKey;
  await mx.nfts().mint({
    mintAddress: sft.address,
    amount: token(42),
    toOwner,
  });
  const updatedSft = await mx.nfts().refresh(sft);

  // Then the SFT now has 42 tokens in its supply.
  spok(t, updatedSft, {
    model: 'sft',
    $topic: 'Updated SFT',
    mint: { supply: spokSameAmount(token(42)) },
  } as unknown as Specifications<Sft>);

  // And the owner received the tokens.
  // TODO: Check that the owner received the tokens.
});
