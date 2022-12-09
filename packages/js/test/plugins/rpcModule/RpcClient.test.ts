import test, { Test } from 'tape';
import { metaplex, killStuckProcess } from '../../helpers';
import { ParsedProgramError } from '@/index';

killStuckProcess();

test('[rpcModule] it parses program errors when sending transactions', async (t: Test) => {
  // Given a Metaplex instance using a CoreRpcDriver.
  const mx = await metaplex();

  // When we try to create an NFT with a name that's too long.
  const promise = mx.nfts().create({
    uri: 'http://example.com/nft',
    sellerFeeBasisPoints: 200,
    name: 'x'.repeat(100), // Name is too long.
  });

  // Then we receive a parsed program error.
  try {
    await promise;
    t.fail('Expected a ParsedProgramError');
  } catch (error) {
    t.ok(error instanceof ParsedProgramError);
    t.ok((error as ParsedProgramError).message.includes('Name too long'));
  }
});
