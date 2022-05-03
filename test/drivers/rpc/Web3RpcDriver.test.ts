import test, { Test } from 'tape';
import { Web3RpcDriver } from '@/index';
import { createMasterEditionV3Builder } from '@/programs';
import { metaplex, killStuckProcess } from '../../helpers';
import { Keypair } from '@solana/web3.js';

killStuckProcess();

const init = async () => {
  const mx = await metaplex();
  mx.setRpc(new Web3RpcDriver(mx));

  return { mx, rpc: mx.rpc() };
};

test('rpc-driver: it parses program errors when sending transactions', async (t: Test) => {
  // Given a Metaplex instance using a Web3RpcDriver.
  const { mx } = await init();

  // When
  const promise = mx.rpc().sendTransaction(
    createMasterEditionV3Builder({
      payer: mx.identity(),
      mintAuthority: mx.identity(),
      updateAuthority: mx.identity(),
      mint: Keypair.generate().publicKey,
      metadata: Keypair.generate().publicKey,
      masterEdition: Keypair.generate().publicKey,
    })
  );

  try {
    await promise;
  } catch (error) {
    console.log(error);
  }
});
