import test, { Test } from 'tape';
import { Keypair } from '@solana/web3.js';
import { LOCALHOST } from '@metaplex-foundation/amman';
import { Metaplex, keypairIdentity, mockStorage } from '../../../src';

const metaplex = () => Metaplex.make(LOCALHOST)
	.setIdentity(keypairIdentity(Keypair.generate()))
	.setStorage(mockStorage());

test('it can create an NFT with minimum configuration', async (t: Test) => {
	const nft = await metaplex().nfts().createNft({
		name: 'My NFT',
		uri: 'https://example.org/123',
	});

	console.log(nft);

	t.pass();
});
