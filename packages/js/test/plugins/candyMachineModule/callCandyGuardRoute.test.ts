import test from 'tape';
import { createWallet, killStuckProcess, metaplex } from '../../helpers';
import { createCandyMachine } from './helpers';
import { getMerkleProof, getMerkleRoot } from '@/index';

killStuckProcess();

test('[candyMachineModule] it can call the route instruction of a specific guard', async (t) => {
  // Given a Candy Machine with an allowList guard which supports the route instruction.
  const mx = await metaplex();
  const payer = await createWallet(mx, 10);
  const allowedWallets = [
    payer.publicKey.toBase58(),
    'Ur1CbWSGsXCdedknRbJsEk7urwAvu1uddmQv51nAnXB',
    'GjwcWFQYzemBtpUoN5fMAP2FZviTtMRWCmrppGuTthJS',
    '2vjCrmEFiN9CLLhiqy8u1JPh48av8Zpzp3kNkdTtirYG',
  ];
  const { candyMachine } = await createCandyMachine(mx, {
    guards: {
      allowList: { merkleRoot: getMerkleRoot(allowedWallets) },
    },
  });

  // When we mint an NFT from the candy machine using the mint authority.
  await mx.candyMachines().callGuardRoute(
    {
      candyMachine,
      guard: 'allowList',
      settings: {
        path: 'proof',
        merkleProof: getMerkleProof(allowedWallets, payer.publicKey.toBase58()),
      },
    },
    { payer }
  );

  // Then ...
  t.pass('todo');
});
