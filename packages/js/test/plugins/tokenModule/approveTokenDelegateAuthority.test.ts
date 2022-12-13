import { Keypair } from '@solana/web3.js';
import spok, { Specifications } from 'spok';
import test, { Test } from 'tape';
import {
  assertThrows,
  killStuckProcess,
  metaplex,
  spokSameAmount,
  spokSamePubkey,
} from '../../helpers';
import { refreshToken } from './helpers';
import { Token, token } from '@/index';

killStuckProcess();

test('[tokenModule] a token owner can approve a new token delegate authority', async (t: Test) => {
  // Given a Metaplex instance and an existing token account containing 42 tokens.
  const mx = await metaplex();
  const owner = Keypair.generate();
  const { token: tokenWithMint } = await mx.tokens().createTokenWithMint({
    owner: owner.publicKey,
    initialSupply: toTokenAmount(42),
  });

  // When we approve a new token delegate authority for 10 tokens.
  const delegateAuthority = Keypair.generate();
  await mx.tokens().approveDelegateAuthority({
    mintAddress: tokenWithMint.mint.address,
    delegateAuthority: delegateAuthority.publicKey,
    amount: toTokenAmount(10),
    owner,
  });

  // Then the token account was updated.
  spok(t, await refreshToken(mx, tokenWithMint), {
    $topic: 'Refreshed Token',
    address: spokSamePubkey(tokenWithMint.address),
    delegateAddress: spokSamePubkey(delegateAuthority.publicKey),
    delegateAmount: spokSameAmount(toTokenAmount(10)),
  } as unknown as Specifications<Token>);

  // And the delegate authority can do what they want with up to 10 of these tokens.
  const newOwner = Keypair.generate();
  await mx.tokens().send({
    mintAddress: tokenWithMint.mint.address,
    delegateAuthority,
    fromOwner: owner.publicKey,
    toOwner: newOwner.publicKey,
    amount: toTokenAmount(8),
  });

  // And the data is updated correctly on the token account afterwards.
  spok(t, await refreshToken(mx, tokenWithMint), {
    $topic: 'Refreshed Token After sending',
    address: spokSamePubkey(tokenWithMint.address),
    amount: spokSameAmount(toTokenAmount(34)),
    delegateAddress: spokSamePubkey(delegateAuthority.publicKey),
    delegateAmount: spokSameAmount(toTokenAmount(2)),
  } as unknown as Specifications<Token>);
});

test('[tokenModule] an approved delegate authority is automatically revoked when all delegated tokens where used', async (t: Test) => {
  // Given a Metaplex instance and an existing token account containing 42 tokens.
  const mx = await metaplex();
  const owner = Keypair.generate();
  const { token: tokenWithMint } = await mx.tokens().createTokenWithMint({
    owner: owner.publicKey,
    initialSupply: toTokenAmount(42),
  });

  // And given we approved a new token delegate authority for 10 tokens.
  const delegateAuthority = Keypair.generate();
  await mx.tokens().approveDelegateAuthority({
    mintAddress: tokenWithMint.mint.address,
    delegateAuthority: delegateAuthority.publicKey,
    amount: toTokenAmount(10),
    owner,
  });

  // When we use all 10 delegated tokens from that delegate authority.
  const newOwner = Keypair.generate();
  await mx.tokens().send({
    mintAddress: tokenWithMint.mint.address,
    delegateAuthority,
    fromOwner: owner.publicKey,
    toOwner: newOwner.publicKey,
    amount: toTokenAmount(10),
  });

  // Then the delegated authority was automatically revoked.
  spok(t, await refreshToken(mx, tokenWithMint), {
    $topic: 'Refreshed Token After sending',
    address: spokSamePubkey(tokenWithMint.address),
    amount: spokSameAmount(toTokenAmount(32)),
    delegateAddress: null,
    delegateAmount: spokSameAmount(toTokenAmount(0)),
  } as unknown as Specifications<Token>);
});

test('[tokenModule] a delegated authority cannot use more tokens than initially agreed', async (t: Test) => {
  // Given a Metaplex instance and an existing token account containing 42 tokens.
  const mx = await metaplex();
  const owner = Keypair.generate();
  const { token: tokenWithMint } = await mx.tokens().createTokenWithMint({
    owner: owner.publicKey,
    initialSupply: toTokenAmount(42),
  });

  // And given we approved a new token delegate authority for 10 tokens.
  const delegateAuthority = Keypair.generate();
  await mx.tokens().approveDelegateAuthority({
    mintAddress: tokenWithMint.mint.address,
    delegateAuthority: delegateAuthority.publicKey,
    amount: toTokenAmount(10),
    owner,
  });

  // When we try to use more than the 10 tokens delegated.
  const newOwner = Keypair.generate();
  const promise = mx.tokens().send({
    mintAddress: tokenWithMint.mint.address,
    delegateAuthority,
    fromOwner: owner.publicKey,
    toOwner: newOwner.publicKey,
    amount: toTokenAmount(20),
  });

  // Then we expect an error.
  // Note that we don't get a nice parsed error because we don't
  // have a generated cusper instance for the SPL Token program yet.
  await assertThrows(t, promise, /Error: insufficient funds/);
});
