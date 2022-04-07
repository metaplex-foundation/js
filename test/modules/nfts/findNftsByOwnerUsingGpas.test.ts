import { FindNftsByOwnerOperation } from '@/modules';
import { clusterApiUrl, PublicKey } from '@solana/web3.js';
import test, { Test } from 'tape';
import { metaplexGuest } from 'test/helpers';

test('dummy', async (t: Test) => {
	const mx = metaplexGuest({ rpcEndpoint: clusterApiUrl('mainnet-beta') });
  // const owner = new PublicKey('B1AfN7AgpMyctfFbjmvRAvE1yziZFDb9XCwydBjJwtRN');
  const owner = new PublicKey('LorisCg1FTs89a32VSrFskYDgiRbNQzct1WxyZb7nuA');
  const nfts = await mx.execute(new FindNftsByOwnerOperation(owner));
  console.log('DONE', nfts.map(nft => nft.name));
  t.end();
});
