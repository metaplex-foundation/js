import { token } from '@/index';
import { Keypair } from '@solana/web3.js';
import test, { Test } from 'tape';
import { assertThrows, killStuckProcess, metaplex } from '../../helpers';

killStuckProcess();

test('[tokenModule] a token owner can revoke an existing token delegate authority', async (t: Test) => {
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

  // And an approved token delegate authority for 10 tokens.
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

  // When the token owner revoke that authority.
  await mx
    .tokens()
    .revokeDelegateAuthority({
      mintAddress: tokenWithMint.mint.address,
      owner,
    })
    .run();

  // Then the delegate authority cannot use anymore tokens.
  const newOwner = Keypair.generate();
  const promise = mx
    .tokens()
    .send({
      mintAddress: tokenWithMint.mint.address,
      delegateAuthority,
      fromOwner: owner.publicKey,
      toOwner: newOwner.publicKey,
      amount: token(1),
    })
    .run();
  await assertThrows(t, promise, /Error: owner does not match/);
});
