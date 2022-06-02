import test, { Test } from 'tape';
import { ParsedProgramError } from '@/index';
import { metaplex, killStuckProcess } from '../../helpers';

killStuckProcess();

test('rpc-client: it parses program errors when sending transactions', async (t: Test) => {
  // Given a Metaplex instance using a CoreRpcDriver.
  const mx = await metaplex();

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
