import test, { Test } from 'tape';
import { CoreRpcDriver, ParsedProgramError } from '@/index';
import { metaplex, killStuckProcess } from '../../helpers';

killStuckProcess();

const init = async () => {
  const mx = await metaplex();

  // Ensure we are testing the CoreRpcDriver.
  mx.setRpcDriver(new CoreRpcDriver(mx));

  return { mx, rpc: mx.rpc() };
};

test('rpc-driver: it parses program errors when sending transactions', async (t: Test) => {
  // Given a Metaplex instance using a CoreRpcDriver.
  const { mx } = await init();

  // When we try to create an NFT with a name that's too long.
  const promise = mx.nfts().create({
    uri: 'http://example.com/nft',
    name: 'x'.repeat(100), // Name is too long.
  });

  // Then we receive a parsed program error.
  try {
    await promise;
    t.fail('Expected a ParsedProgramError');
  } catch (error) {
    t.ok(error instanceof ParsedProgramError);
    t.ok(
      (error as ParsedProgramError).message.includes(
        'TokenMetadataProgram > Name too long'
      )
    );
  }
});
