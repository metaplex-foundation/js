import spok, { Specifications } from 'spok';
import test, { Test } from 'tape';
import { Keypair } from '@solana/web3.js';
import {
  createSft,
  killStuckProcess,
  metaplex,
  spokSameAmount,
} from '../../helpers';
import { Sft, token, TokenWithMint } from '@/index';

killStuckProcess();

test('[nftModule] it can mint tokens from an SFT', async (t: Test) => {
  // Given an existing SFT with no supply.
  const mx = await metaplex();
  const sft = await createSft(mx);
  t.equal(sft.mint.supply.basisPoints.toNumber(), 0, 'SFT has no supply');

  // And a wallet with an empty ATA.
  const toOwner = Keypair.generate().publicKey;
  await mx.tokens().createToken({ mint: sft.address, owner: toOwner });

  // When we mint 42 tokens to that wallet.
  await mx.nfts().mint({
    nftOrSft: sft,
    amount: token(42),
    toOwner,
  });

  // Then the SFT now has 42 tokens in its supply.
  const updatedSft = await mx.nfts().refresh(sft);
  spok(t, updatedSft, {
    $topic: 'Updated SFT',
    model: 'sft',
    mint: { supply: spokSameAmount(token(42)) },
  } as unknown as Specifications<Sft>);

  // And the owner received the tokens.
  const ownerTokenAccount = await mx.tokens().findTokenWithMintByMint({
    mint: sft.address,
    address: toOwner,
    addressType: 'owner',
  });
  spok(t, ownerTokenAccount, {
    $topic: 'Updated SFT',
    model: 'tokenWithMint',
    amount: spokSameAmount(token(42)),
    mint: { supply: spokSameAmount(token(42)) },
  } as unknown as Specifications<TokenWithMint>);
});

test('[nftModule] it creates the ATA when minting tokens from an SFT', async (t: Test) => {
  // Given an existing SFT with no supply.
  const mx = await metaplex();
  const sft = await createSft(mx);
  t.equal(sft.mint.supply.basisPoints.toNumber(), 0, 'SFT has no supply');

  // When we mint 42 tokens to a new owner.
  const toOwner = Keypair.generate().publicKey;
  await mx.nfts().mint({
    nftOrSft: sft,
    amount: token(42),
    toOwner,
  });

  // Then the SFT now has 42 tokens in its supply.
  const updatedSft = await mx.nfts().refresh(sft);
  spok(t, updatedSft, {
    $topic: 'Updated SFT',
    model: 'sft',
    mint: { supply: spokSameAmount(token(42)) },
  } as unknown as Specifications<Sft>);

  // And the owner received the tokens.
  const ownerTokenAccount = await mx.tokens().findTokenWithMintByMint({
    mint: sft.address,
    address: toOwner,
    addressType: 'owner',
  });
  spok(t, ownerTokenAccount, {
    $topic: 'Updated SFT',
    model: 'tokenWithMint',
    amount: spokSameAmount(token(42)),
    mint: { supply: spokSameAmount(token(42)) },
  } as unknown as Specifications<TokenWithMint>);
});
