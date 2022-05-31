import { Keypair } from '@solana/web3.js';
import test, { Test } from 'tape';
import { killStuckProcess, metaplex, MetaplexTestOptions } from '../../helpers';
import {
  derivedIdentity,
  keypairIdentity,
  KeypairIdentityDriver,
  sol,
  isEqualToAmount,
  isLessThanAmount,
  isGreaterThanAmount,
} from '@/index';

killStuckProcess();

const init = async (
  options: MetaplexTestOptions & { message?: string } = {}
) => {
  const mx = await metaplex(options);

  mx.use(derivedIdentity());

  if (options.message != null) {
    await mx.derivedIdentity().deriveFrom(options.message);
  }

  return mx;
};

test('[derivedIdentity] it derives a Keypair from the current identity', async (t: Test) => {
  // Given a Metaplex instance using the derived identity plugin.
  const mx = await init();

  // When we derive the identity using a message.
  await mx.derivedIdentity().deriveFrom('Hello World');

  // Then we get a Signer Keypair.
  t.true(mx.derivedIdentity().publicKey);
  t.true(mx.derivedIdentity().secretKey);

  // And it is different from the original identity.
  t.false(mx.derivedIdentity().equals(mx.identity()));
});

test('[derivedIdentity] it keeps track of the identity it originates from', async (t: Test) => {
  // Given a Metaplex instance using the derived identity plugin.
  const mx = await init();
  const identityPublicKey = mx.identity().publicKey;

  // When we derive the identity.
  await mx.derivedIdentity().deriveFrom('Hello World');

  // Then the derived identity kept track of the identity it originated from.
  t.true(identityPublicKey.equals(mx.derivedIdentity().originalPublicKey));

  // Even if we end up updating the identity.
  mx.use(keypairIdentity(Keypair.generate()));
  t.true(identityPublicKey.equals(mx.derivedIdentity().originalPublicKey));
  t.false(mx.identity().equals(mx.derivedIdentity().originalPublicKey));
});

test('[derivedIdentity] it can derive a Keypair from an explicit IdentitySigner', async (t: Test) => {
  // Given a Metaplex instance and a custom IdentitySigner.
  const mx = await init();
  const signer = new KeypairIdentityDriver(Keypair.generate());

  // When we derive the identity by providing the signer explicitly.
  await mx.derivedIdentity().deriveFrom('Hello World', signer);

  // Then a new derived identity was created for that signer.
  t.true(signer.publicKey.equals(mx.derivedIdentity().originalPublicKey));

  // But not for the current identity.
  t.false(mx.identity().equals(mx.derivedIdentity().originalPublicKey));
});

test('[derivedIdentity] it derives the same address when using the same message', async (t: Test) => {
  // Given a Metaplex instance using the derived identity plugin.
  const mx = await init();

  // When we derive the identity twice with the same message.
  await mx.derivedIdentity().deriveFrom('Hello World');
  const derivedPublicKeyA = mx.derivedIdentity().publicKey;

  await mx.derivedIdentity().deriveFrom('Hello World');
  const derivedPubliKeyB = mx.derivedIdentity().publicKey;

  // Then we get the same Keypair.
  t.true(derivedPublicKeyA.equals(derivedPubliKeyB));
});

test('[derivedIdentity] it derives different addresses from different messages', async (t: Test) => {
  // Given a Metaplex instance using the derived identity plugin.
  const mx = await init();

  // When we derive the identity twice with different messages.
  await mx.derivedIdentity().deriveFrom('Hello World');
  const derivedPublicKeyA = mx.derivedIdentity().publicKey;

  await mx.derivedIdentity().deriveFrom('Hello Papito');
  const derivedPubliKeyB = mx.derivedIdentity().publicKey;

  // Then we get the different Keypairs.
  t.false(derivedPublicKeyA.equals(derivedPubliKeyB));
});

test('[derivedIdentity] it can fund the derived identity', async (t: Test) => {
  // Given a Metaplex instance with a derived identity
  // and an identity airdropped with 5 SOLs.
  const mx = await init({ message: 'fund', solsToAirdrop: 5 });

  // When we fund the derived identity by 1 SOL.
  await mx.derivedIdentity().fund(sol(1));

  // And fetch the balances of both the identity and the derived identity.
  const identityBalance = await mx.rpc().getBalance(mx.identity().publicKey);
  const derivedBalance = await mx
    .rpc()
    .getBalance(mx.derivedIdentity().publicKey);

  // Then we can see that 1 SOL was transferred from the identity to the derived identity.
  t.true(isLessThanAmount(identityBalance, sol(4)));
  t.true(isGreaterThanAmount(identityBalance, sol(3.9)));
  t.true(isEqualToAmount(derivedBalance, sol(1)));
});
