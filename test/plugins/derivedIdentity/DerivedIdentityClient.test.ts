import { Keypair } from '@solana/web3.js';
import test, { Test } from 'tape';
import { amman, killStuckProcess, metaplex } from '../../helpers';
import {
  Metaplex,
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
  options: {
    message?: string;
    identityAirdrop?: number;
    derivedAirdrop?: number;
  } = {}
) => {
  const mx = await metaplex({ solsToAirdrop: options.identityAirdrop });
  mx.use(derivedIdentity());

  if (options.message != null) {
    await mx.derivedIdentity().deriveFrom(options.message).run();
  }

  if (options.derivedAirdrop != null) {
    await amman.airdrop(
      mx.connection,
      mx.derivedIdentity().publicKey,
      options.derivedAirdrop
    );
  }

  return mx;
};

const getBalances = async (mx: Metaplex) => {
  const identityBalance = await mx.rpc().getBalance(mx.identity().publicKey);
  const derivedBalance = await mx
    .rpc()
    .getBalance(mx.derivedIdentity().publicKey);

  return { identityBalance, derivedBalance };
};

test('[derivedIdentity] it derives a Keypair from the current identity', async (t: Test) => {
  // Given a Metaplex instance using the derived identity plugin.
  const mx = await init();

  // When we derive the identity using a message.
  await mx.derivedIdentity().deriveFrom('Hello World').run();

  // Then we get a Signer Keypair.
  t.ok(mx.derivedIdentity().publicKey, 'derived identity has a public key');
  t.ok(mx.derivedIdentity().secretKey, 'derived identity has a secret key');

  // And it is different from the original identity.
  t.notOk(
    mx.derivedIdentity().equals(mx.identity()),
    'derived identity is different from original identity'
  );
});

test('[derivedIdentity] it keeps track of the identity it originates from', async (t: Test) => {
  // Given a Metaplex instance using the derived identity plugin.
  const mx = await init();
  const identityPublicKey = mx.identity().publicKey;

  // When we derive the identity.
  await mx.derivedIdentity().deriveFrom('Hello World').run();

  // Then the derived identity kept track of the identity it originated from.
  t.ok(
    identityPublicKey.equals(mx.derivedIdentity().originalPublicKey),
    'derived identity stores the public key of the identity it originated from'
  );

  // Even if we end up updating the identity.
  mx.use(keypairIdentity(Keypair.generate()));
  t.ok(
    identityPublicKey.equals(mx.derivedIdentity().originalPublicKey),
    'derived identity stores the public key of the identity it originated from even after it changed'
  );
  t.notOk(
    mx.identity().equals(mx.derivedIdentity().originalPublicKey),
    "derived identity's stored identity is different to the new identity"
  );
});

test('[derivedIdentity] it can derive a Keypair from an explicit IdentitySigner', async (t: Test) => {
  // Given a Metaplex instance and a custom IdentitySigner.
  const mx = await init();
  const signer = new KeypairIdentityDriver(Keypair.generate());

  // When we derive the identity by providing the signer explicitly.
  await mx.derivedIdentity().deriveFrom('Hello World', signer).run();

  // Then a new derived identity was created for that signer.
  t.ok(
    signer.publicKey.equals(mx.derivedIdentity().originalPublicKey),
    'derived identity stores the public key of the provided signer'
  );

  // But not for the current identity.
  t.notOk(
    mx.identity().equals(mx.derivedIdentity().originalPublicKey),
    'derived identity does not store the public key of the current identity'
  );
});

test('[derivedIdentity] it derives the same address when using the same message', async (t: Test) => {
  // Given a Metaplex instance using the derived identity plugin.
  const mx = await init();

  // When we derive the identity twice with the same message.
  await mx.derivedIdentity().deriveFrom('Hello World').run();
  const derivedPublicKeyA = mx.derivedIdentity().publicKey;

  await mx.derivedIdentity().deriveFrom('Hello World').run();
  const derivedPubliKeyB = mx.derivedIdentity().publicKey;

  // Then we get the same Keypair.
  t.ok(
    derivedPublicKeyA.equals(derivedPubliKeyB),
    'the two derived identities are the same'
  );
});

test('[derivedIdentity] it derives different addresses from different messages', async (t: Test) => {
  // Given a Metaplex instance using the derived identity plugin.
  const mx = await init();

  // When we derive the identity twice with different messages.
  await mx.derivedIdentity().deriveFrom('Hello World').run();
  const derivedPublicKeyA = mx.derivedIdentity().publicKey;

  await mx.derivedIdentity().deriveFrom('Hello Papito').run();
  const derivedPubliKeyB = mx.derivedIdentity().publicKey;

  // Then we get the different Keypairs.
  t.notOk(
    derivedPublicKeyA.equals(derivedPubliKeyB),
    'the two derived identities are different'
  );
});

test('[derivedIdentity] it can fund the derived identity', async (t: Test) => {
  // Given a Metaplex instance with:
  // - an identity airdropped with 5 SOLs.
  // - a derived identity with no SOLs.
  const mx = await init({ message: 'fund', identityAirdrop: 5 });

  // When we fund the derived identity by 1 SOL.
  await mx.derivedIdentity().fund(sol(1)).run();

  // Then we can see that 1 SOL was transferred from the identity to the derived identity.
  // It's a little less due to the transaction fee.
  const { identityBalance, derivedBalance } = await getBalances(mx);
  t.ok(
    isLessThanAmount(identityBalance, sol(4)),
    'identity balance is less than 4'
  );
  t.ok(
    isGreaterThanAmount(identityBalance, sol(3.9)),
    'identity balance is greater than 3.9'
  );
  t.ok(isEqualToAmount(derivedBalance, sol(1)), 'derived balance is 1');
});

test('[derivedIdentity] it can withdraw from the derived identity', async (t: Test) => {
  // Given a Metaplex instance with:
  // - an identity airdropped with 5 SOLs.
  // - a derived identity airdropped with 2 SOLs.
  const mx = await init({
    message: 'withdraw',
    identityAirdrop: 5,
    derivedAirdrop: 2,
  });

  // When we withdraw 1 SOL from the derived identity.
  await mx.derivedIdentity().withdraw(sol(1)).run();

  // Then we can see that 1 SOL was transferred from the derived identity to the identity.
  // It's a little less due to the transaction fee.
  const { identityBalance, derivedBalance } = await getBalances(mx);
  t.ok(
    isLessThanAmount(identityBalance, sol(6)),
    'identity balance is less than 6'
  );
  t.ok(
    isGreaterThanAmount(identityBalance, sol(5.9)),
    'identity balance is greater than 5.9'
  );
  t.ok(isEqualToAmount(derivedBalance, sol(1)), 'derived balance is 1');
});

test('[derivedIdentity] it can withdraw everything from the derived identity', async (t: Test) => {
  // Given a Metaplex instance with:
  // - an identity airdropped with 5 SOLs.
  // - a derived identity airdropped with 2 SOLs.
  const mx = await init({
    message: 'withdraw',
    identityAirdrop: 5,
    derivedAirdrop: 2,
  });

  // When we withdraw everything from the derived identity.
  await mx.derivedIdentity().withdrawAll().run();

  // Then we can see that 1 SOL was transferred from the derived identity to the identity.
  // It's a little less due to the transaction fee.
  const { identityBalance, derivedBalance } = await getBalances(mx);
  t.ok(
    isLessThanAmount(identityBalance, sol(7)),
    'identity balance is less than 7'
  );
  t.ok(
    isGreaterThanAmount(identityBalance, sol(6.9)),
    'identity balance is greater than 6.9'
  );
  t.ok(isEqualToAmount(derivedBalance, sol(0)), 'derived balance is 0');
});
