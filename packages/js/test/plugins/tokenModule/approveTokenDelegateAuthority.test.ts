import { Token, token } from '@/index';
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

killStuckProcess();

test('[tokenModule] a token owner can approve a new token delegate authority', async (t: Test) => {
  // Given a Metaplex instance and an existing token account containing 42 tokens.
  const mx = await metaplex();
  const owner = Keypair.generate();
  const { token: tokenWithMint } = await mx
    .tokens()
    .createTokenWithMint({
      owner: owner.publicKey,
      initialSupply: token(42),
    })
    .run();

  // When we approve a new token delegate authority for 10 tokens.
  const delegateAuthority = Keypair.generate();
  await mx
    .tokens()
    .approveDelegateAuthority({
      mintAddress: tokenWithMint.mint.address,
      delegateAuthority: delegateAuthority.publicKey,
      amount: token(10),
      owner,
    })
    .run();

  // Then the token account was updated.
  spok(t, await refreshToken(mx, tokenWithMint), {
    $topic: 'Refreshed Token',
    address: spokSamePubkey(tokenWithMint.address),
    delegateAddress: spokSamePubkey(delegateAuthority.publicKey),
    delegateAmount: spokSameAmount(token(10)),
  } as unknown as Specifications<Token>);

  // And the delegate authority can do what they want with up to 10 of these tokens.
  const newOwner = Keypair.generate();
  await mx
    .tokens()
    .send({
      mintAddress: tokenWithMint.mint.address,
      delegateAuthority,
      fromOwner: owner.publicKey,
      toOwner: newOwner.publicKey,
      amount: token(8),
    })
    .run();

  // And the data is updated correctly on the token account afterwards.
  spok(t, await refreshToken(mx, tokenWithMint), {
    $topic: 'Refreshed Token After sending',
    address: spokSamePubkey(tokenWithMint.address),
    amount: spokSameAmount(token(34)),
    delegateAddress: spokSamePubkey(delegateAuthority.publicKey),
    delegateAmount: spokSameAmount(token(2)),
  } as unknown as Specifications<Token>);
});

test('[tokenModule] an approved delegate authority is automatically revoked when all delegated tokens where used', async (t: Test) => {
  // Given a Metaplex instance and an existing token account containing 42 tokens.
  const mx = await metaplex();
  const owner = Keypair.generate();
  const { token: tokenWithMint } = await mx
    .tokens()
    .createTokenWithMint({
      owner: owner.publicKey,
      initialSupply: token(42),
    })
    .run();

  // And given we approved a new token delegate authority for 10 tokens.
  const delegateAuthority = Keypair.generate();
  await mx
    .tokens()
    .approveDelegateAuthority({
      mintAddress: tokenWithMint.mint.address,
      delegateAuthority: delegateAuthority.publicKey,
      amount: token(10),
      owner,
    })
    .run();

  // When we use all 10 delegated tokens from that delegate authority.
  const newOwner = Keypair.generate();
  await mx
    .tokens()
    .send({
      mintAddress: tokenWithMint.mint.address,
      delegateAuthority,
      fromOwner: owner.publicKey,
      toOwner: newOwner.publicKey,
      amount: token(10),
    })
    .run();

  // Then the delegated authority was automatically revoked.
  spok(t, await refreshToken(mx, tokenWithMint), {
    $topic: 'Refreshed Token After sending',
    address: spokSamePubkey(tokenWithMint.address),
    amount: spokSameAmount(token(32)),
    delegateAddress: null,
    delegateAmount: spokSameAmount(token(0)),
  } as unknown as Specifications<Token>);
});

test('[tokenModule] a delegated authority cannot use more tokens than initially agreed', async (t: Test) => {
  // Given a Metaplex instance and an existing token account containing 42 tokens.
  const mx = await metaplex();
  const owner = Keypair.generate();
  const { token: tokenWithMint } = await mx
    .tokens()
    .createTokenWithMint({
      owner: owner.publicKey,
      initialSupply: token(42),
    })
    .run();

  // And given we approved a new token delegate authority for 10 tokens.
  const delegateAuthority = Keypair.generate();
  await mx
    .tokens()
    .approveDelegateAuthority({
      mintAddress: tokenWithMint.mint.address,
      delegateAuthority: delegateAuthority.publicKey,
      amount: token(10),
      owner,
    })
    .run();

  // When we try to use more than the 10 tokens delegated.
  const newOwner = Keypair.generate();
  const promise = mx
    .tokens()
    .send({
      mintAddress: tokenWithMint.mint.address,
      delegateAuthority,
      fromOwner: owner.publicKey,
      toOwner: newOwner.publicKey,
      amount: token(20),
    })
    .run();

  // Then we expect an error.
  // Note that we don't get a nice parsed error because we don't
  // have a generated cusper instance for the SPL Token program yet.
  await assertThrows(t, promise, /Error: insufficient funds/);
});
