import test, { Test } from 'tape';
import { Web3RpcDriver, ParsedProgramError } from '@/index';
import { metaplex, killStuckProcess } from '../../helpers';

killStuckProcess();

const init = async () => {
  const mx = await metaplex();

  // Ensure we are testing the Web3RpcDriver.
  mx.setRpcDriver(new Web3RpcDriver(mx));

  return { mx, rpc: mx.rpc() };
};

test('rpc-driver: it parses program errors when sending transactions', async (t: Test) => {
  // Given a Metaplex instance using a Web3RpcDriver.
  const { mx } = await init();

  // When we try to create an NFT with a name that's too long.
  const promise = mx.nfts().createNft({
    uri: 'http://example.com/nft',
    name: 'x'.repeat(100), // Name is too long.
  });

  // Then we receive a parsed program error.
  try {
    await promise;
  } catch (error) {
    t.ok(error instanceof ParsedProgramError);
    t.ok((error as ParsedProgramError).message.includes('TokenMetadataProgram > Name too long'));
  }
});
