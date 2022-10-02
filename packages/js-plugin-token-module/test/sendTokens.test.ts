import { findAssociatedTokenAccountPda, token } from '@/index';
import { Keypair } from '@solana/web3.js';
import test, { Test } from 'tape';
import { killStuckProcess, metaplex } from '../../helpers';
import { assertRefreshedTokenHasAmount, assertTokenHasAmount } from './helpers';

killStuckProcess();

test('[tokenModule] it can send tokens to an existing token account', async (t: Test) => {
  // Given a Metaplex instance and a mint with an initial token holding 100 tokens.
  const mx = await metaplex();
  const { token: fromToken } = await mx
    .tokens()
    .createTokenWithMint({ initialSupply: token(100) })
    .run();
  const mint = fromToken.mint;
  assertTokenHasAmount(t, fromToken, token(100));

  // And an existing token account to send tokens to.
  const toTokenSigner = Keypair.generate();
  const { token: toToken } = await mx
    .tokens()
    .createToken({ mint: mint.address, token: toTokenSigner })
    .run();
  assertTokenHasAmount(t, toToken, token(0));

  // When we send 42 tokens to that token account.
  await mx
    .tokens()
    .send({
      mintAddress: mint.address,
      amount: token(42),
      toToken: toToken.address,
    })
    .run();

  // Then the transfer of tokens was successful.
  await assertRefreshedTokenHasAmount(t, mx, fromToken, token(58));
  await assertRefreshedTokenHasAmount(t, mx, toToken, token(42));
});

test('[tokenModule] it can send tokens to an existing associated token account', async (t: Test) => {
  // Given a Metaplex instance and a mint with an initial token holding 100 tokens.
  const mx = await metaplex();
  const { token: fromToken } = await mx
    .tokens()
    .createTokenWithMint({ initialSupply: token(100) })
    .run();
  const mint = fromToken.mint;
  assertTokenHasAmount(t, fromToken, token(100));

  // And an existing associated token account to send tokens to.
  const toOwner = Keypair.generate().publicKey;
  const { token: toToken } = await mx
    .tokens()
    .createToken({ mint: mint.address, owner: toOwner })
    .run();
  assertTokenHasAmount(t, toToken, token(0));

  // When we send 42 tokens to that owner.
  await mx
    .tokens()
    .send({ mintAddress: mint.address, amount: token(42), toOwner })
    .run();

  // Then the transfer of tokens was successful.
  await assertRefreshedTokenHasAmount(t, mx, fromToken, token(58));
  await assertRefreshedTokenHasAmount(t, mx, toToken, token(42));
});

test('[tokenModule] it can send tokens to an non-existing token account', async (t: Test) => {
  // Given a Metaplex instance and a mint with an initial token holding 100 tokens.
  const mx = await metaplex();
  const { token: fromToken } = await mx
    .tokens()
    .createTokenWithMint({ initialSupply: token(100) })
    .run();
  const mint = fromToken.mint;
  assertTokenHasAmount(t, fromToken, token(100));

  // And an token account to send tokens to that does not exist.
  const toTokenSigner = Keypair.generate();
  const toTokenAccount = await mx.rpc().getAccount(toTokenSigner.publicKey);
  t.false(toTokenAccount.exists, 'toToken account does not exist');

  // When we send 42 tokens to that token account by passing it as a signer.
  await mx
    .tokens()
    .send({
      mintAddress: mint.address,
      amount: token(42),
      toToken: toTokenSigner,
    })
    .run();

  // Then the account was created.
  const toToken = await mx
    .tokens()
    .findTokenByAddress({ address: toTokenSigner.publicKey })
    .run();

  // And the transfer of tokens was successful.
  await assertRefreshedTokenHasAmount(t, mx, fromToken, token(58));
  assertTokenHasAmount(t, toToken, token(42));
});

test('[tokenModule] it can send tokens to an non-existing associated token account', async (t: Test) => {
  // Given a Metaplex instance and a mint with an initial token holding 100 tokens.
  const mx = await metaplex();
  const { token: fromToken } = await mx
    .tokens()
    .createTokenWithMint({ initialSupply: token(100) })
    .run();
  const mint = fromToken.mint;
  assertTokenHasAmount(t, fromToken, token(100));

  // And an owner that does not have an associated token account for that mint yet.
  const toOwner = Keypair.generate().publicKey;
  const toAssociatedToken = findAssociatedTokenAccountPda(
    mint.address,
    toOwner
  );
  const toAssociatedTokenAccount = await mx.rpc().getAccount(toAssociatedToken);
  t.false(toAssociatedTokenAccount.exists, 'toToken account does not exist');

  // When we send 42 tokens to that owner.
  await mx
    .tokens()
    .send({ mintAddress: mint.address, amount: token(42), toOwner })
    .run();

  // Then the associated token account was created.
  const toToken = await mx
    .tokens()
    .findTokenByAddress({ address: toAssociatedToken })
    .run();

  // And the transfer of tokens was successful.
  await assertRefreshedTokenHasAmount(t, mx, fromToken, token(58));
  assertTokenHasAmount(t, toToken, token(42));
});
