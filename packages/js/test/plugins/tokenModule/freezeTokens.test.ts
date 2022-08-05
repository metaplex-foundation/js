import { AccountState } from '@solana/spl-token';
import { Keypair } from '@solana/web3.js';
import test, { Test } from 'tape';
import { killStuckProcess, metaplex } from '../../helpers';
import { refreshToken } from './helpers';

killStuckProcess();

test('[tokenModule] the freeze authority can freeze any token account', async (t: Test) => {
  // Given a Metaplex instance and an existing token account.
  const mx = await metaplex();
  const freezeAuthority = Keypair.generate();
  const owner = Keypair.generate();
  const { token: tokenWithMint } = await mx
    .tokens()
    .createTokenWithMint({
      owner: owner.publicKey,
      freezeAuthority: freezeAuthority.publicKey,
    })
    .run();

  // When the owner freezes its own account.
  await mx
    .tokens()
    .freeze({
      mintAddress: tokenWithMint.mint.address,
      tokenOwner: owner.publicKey,
      freezeAuthority,
    })
    .run();

  // Then the token account is frozen.
  const refreshedToken = await refreshToken(mx, tokenWithMint);
  t.equal(refreshedToken.state, AccountState.Frozen, 'token account is frozen');
});

test.skip('[tokenModule] a frozen account cannot send tokens', async (t: Test) => {
  // Given a Metaplex instance and an existing token account.
  const mx = await metaplex();
  const freezeAuthority = Keypair.generate();
  const owner = Keypair.generate();
  const { token: tokenWithMint } = await mx
    .tokens()
    .createTokenWithMint({
      owner: owner.publicKey,
      freezeAuthority: freezeAuthority.publicKey,
    })
    .run();

  // And that token account has been frozen.
  await mx
    .tokens()
    .freeze({
      mintAddress: tokenWithMint.mint.address,
      tokenOwner: owner.publicKey,
      freezeAuthority,
    })
    .run();

  // When ...

  // Then ...
});

test.skip('[tokenModule] a frozen account cannot be minted to', async (t: Test) => {
  // Given a Metaplex instance and an existing token account.
  const mx = await metaplex();
  const freezeAuthority = Keypair.generate();
  const owner = Keypair.generate();
  const { token: tokenWithMint } = await mx
    .tokens()
    .createTokenWithMint({
      owner: owner.publicKey,
      freezeAuthority: freezeAuthority.publicKey,
    })
    .run();

  // And that token account has been frozen.
  await mx
    .tokens()
    .freeze({
      mintAddress: tokenWithMint.mint.address,
      tokenOwner: owner.publicKey,
      freezeAuthority,
    })
    .run();

  // When ...

  // Then ...
});
