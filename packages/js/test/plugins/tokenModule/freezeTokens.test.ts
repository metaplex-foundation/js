import { token } from '@/index';
import { AccountState } from '@solana/spl-token';
import { Keypair } from '@solana/web3.js';
import test, { Test } from 'tape';
import { assertThrows, killStuckProcess, metaplex } from '../../helpers';
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

test('[tokenModule] a frozen account cannot send tokens', async (t: Test) => {
  // Given a Metaplex instance and an existing token account.
  const mx = await metaplex();
  const freezeAuthority = Keypair.generate();
  const owner = Keypair.generate();
  const { token: tokenWithMint } = await mx
    .tokens()
    .createTokenWithMint({
      owner: owner.publicKey,
      freezeAuthority: freezeAuthority.publicKey,
      initialSupply: token(42),
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

  // When we try to send tokens from the frozen account.
  const promise = mx
    .tokens()
    .send({
      mintAddress: tokenWithMint.mint.address,
      amount: token(10),
      fromOwner: owner,
      toOwner: Keypair.generate().publicKey,
    })
    .run();

  // Then we expect an error.
  await assertThrows(t, promise, /Error: Account is frozen/);
});
