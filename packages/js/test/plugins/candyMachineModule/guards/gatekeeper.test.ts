import {
  DateTime,
  isEqualToAmount,
  Metaplex,
  Pda,
  PublicKey,
  Signer,
  sol,
  toBigNumber,
  TransactionBuilder,
} from '@/index';
import { Keypair } from '@solana/web3.js';
import { Buffer } from 'buffer';
import test from 'tape';
import {
  assertThrows,
  createWallet,
  killStuckProcess,
  metaplex,
} from '../../../helpers';
import { assertMintingWasSuccessful, createCandyMachine } from '../helpers';
import { addGatekeeper, issueVanilla } from '@identity.com/solana-gateway-ts';

killStuckProcess();

test('[candyMachineModule] gatekeeper guard: it allows minting via a gatekeeper service', async (t) => {
  // Given a Gatekeeper Network.
  const mx = await metaplex();
  const { gatekeeperNetwork, gatekeeperAuthority } =
    await createGatekeeperNetwork(mx);

  // And a payer with a valid gateway Token Account from that network.
  const payer = await createWallet(mx, 10);
  const gatewayTokenAccount = await issueGatewayToken(
    mx,
    gatekeeperNetwork.publicKey,
    gatekeeperAuthority,
    payer
  );

  // And a loaded Candy Machine with a gatekeeper guard on that network.
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      gatekeeper: {
        network: gatekeeperNetwork.publicKey,
        expireOnUse: false,
      },
    },
  });

  // When that payer mints from the Candy Machine using its CIVIC pass.
  const { nft } = await mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      payer,
      guards: {
        gatekeeper: {
          tokenAccount: gatewayTokenAccount,
        },
      },
    })
    .run();

  // Then minting was successful.
  await assertMintingWasSuccessful(t, mx, {
    candyMachine,
    collectionUpdateAuthority: collection.updateAuthority.publicKey,
    nft,
    owner: payer.publicKey,
  });
});

test.skip('[candyMachineModule] gatekeeper guard: it defaults to calculating the gateway token PDA for us', async (t) => {
  //
});

test('[candyMachineModule] gatekeeper guard: it forbids minting when providing the wrong token', async (t) => {
  // Given a Gatekeeper Network.
  const mx = await metaplex();
  const { gatekeeperNetwork } = await createGatekeeperNetwork(mx);

  // And a payer without a valid gateway Token Account from that network.
  const payer = await createWallet(mx, 10);
  const wrongToken = Keypair.generate().publicKey;

  // Given a loaded Candy Machine with a gatekeeper guard.
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      gatekeeper: {
        network: gatekeeperNetwork.publicKey,
        expireOnUse: false,
      },
    },
  });

  // When the payer tries to mint from it with the wrong token.
  const promise = mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      payer,
      guards: {
        gatekeeper: {
          tokenAccount: wrongToken,
        },
      },
    })
    .run();

  // Then we expect an error.
  await assertThrows(t, promise, /Gateway token is not valid/);
});

test.skip('[candyMachineModule] gatekeeper guard: it allows minting using gateway tokens that expire when there are still valid', async (t) => {
  //
});

test.skip('[candyMachineModule] gatekeeper guard: it forbits minting using gateway tokens that have expired', async (t) => {
  //
});

test.skip('[candyMachineModule] gatekeeper guard: it may immediately mark gateway tokens as expired after using them', async (t) => {
  //
});

test.skip('[candyMachineModule] gatekeeper guard: it fails if the expire account is needed and not provided (maybe)', async (t) => {
  //
});

test('[candyMachineModule] gatekeeper guard with bot tax: it charges a bot tax when trying to mint using the wrong token', async (t) => {
  // Given a Gatekeeper Network.
  const mx = await metaplex();
  const { gatekeeperNetwork } = await createGatekeeperNetwork(mx);

  // And a payer without a valid gateway Token Account from that network.
  const payer = await createWallet(mx, 10);
  const wrongToken = Keypair.generate().publicKey;

  // Given a loaded Candy Machine with a gatekeeper guard and a botTax guard.
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      botTax: {
        lamports: sol(0.1),
        lastInstruction: true,
      },
      gatekeeper: {
        network: gatekeeperNetwork.publicKey,
        expireOnUse: false,
      },
    },
  });

  // When the payer tries to mint from it with the wrong token.
  const promise = mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      payer,
      guards: {
        gatekeeper: {
          tokenAccount: wrongToken,
        },
      },
    })
    .run();

  // Then we expect a bot tax error.
  await assertThrows(t, promise, /Candy Machine Bot Tax/);

  // And the payer was charged a bot tax.
  const payerBalance = await mx.rpc().getBalance(payer.publicKey);
  t.true(
    isEqualToAmount(payerBalance, sol(9.9), sol(0.01)),
    'payer was charged a bot tax'
  );
});

test('[candyMachineModule] gatekeeper guard: it fails if no mint settings are provided', async (t) => {
  // Given a loaded Candy Machine with a gatekeeper guard.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      gatekeeper: {
        network: Keypair.generate().publicKey,
        expireOnUse: false,
      },
    },
  });

  // When we try to mint from it without providing
  // any mint settings for the gatekeeper guard.
  const promise = mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    })
    .run();

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /Please provide some minting settings for the \[gatekeeper\] guard/
  );
});

const createGatekeeperNetwork = async (
  mx: Metaplex
): Promise<{
  gatekeeperNetwork: Signer;
  gatekeeperAuthority: Signer;
}> => {
  const gatewayProgram = mx.programs().getGateway();
  const gatekeeperAuthority = await createWallet(mx, 10);
  const gatekeeperNetwork = Keypair.generate();
  const gatekeeperAccount = Pda.find(gatewayProgram.address, [
    gatekeeperAuthority.publicKey.toBuffer(),
    gatekeeperNetwork.publicKey.toBuffer(),
    Buffer.from('gatekeeper'),
  ]);

  const addGatekeeperTx = TransactionBuilder.make().add({
    instruction: addGatekeeper(
      gatekeeperAuthority.publicKey,
      gatekeeperAccount,
      gatekeeperAuthority.publicKey,
      gatekeeperNetwork.publicKey
    ),
    signers: [gatekeeperAuthority, gatekeeperNetwork],
  });
  await addGatekeeperTx.sendAndConfirm(mx);

  return { gatekeeperNetwork, gatekeeperAuthority };
};

const issueGatewayToken = async (
  mx: Metaplex,
  gatekeeperNetwork: PublicKey,
  gatekeeperAuthority: Signer,
  payer: Signer,
  expiryDate?: DateTime,
  seeds = [0, 0, 0, 0, 0, 0, 0, 0]
): Promise<PublicKey> => {
  const gatewayProgram = mx.programs().getGateway();
  const gatekeeperAccount = Pda.find(gatewayProgram.address, [
    gatekeeperAuthority.publicKey.toBuffer(),
    gatekeeperNetwork.toBuffer(),
    Buffer.from('gatekeeper'),
  ]);
  const gatewayTokenAccount = Pda.find(gatewayProgram.address, [
    payer.publicKey.toBuffer(),
    Buffer.from('gateway'),
    Buffer.from(seeds),
    gatekeeperNetwork.toBuffer(),
  ]);

  const issueVanillaTx = TransactionBuilder.make().add({
    instruction: issueVanilla(
      gatewayTokenAccount,
      payer.publicKey,
      gatekeeperAccount,
      payer.publicKey,
      gatekeeperAuthority.publicKey,
      gatekeeperNetwork,
      Buffer.from(seeds),
      expiryDate?.toNumber()
    ),
    signers: [payer, gatekeeperAuthority],
  });
  await issueVanillaTx.sendAndConfirm(mx);

  return gatewayTokenAccount;
};
