const test = require('tape');
const { Keypair } = require('@solana/web3.js');
const { LOCALHOST } = require('@metaplex-foundation/amman');
const { Metaplex, keypairIdentity, mockStorage } = require('../../../dist/index.cjs');

const metaplex = () => Metaplex.make(LOCALHOST)
	.setIdentity(keypairIdentity(Keypair.generate()))
	.setStorage(mockStorage());

test('it can create an NFT with minimum configuration', async t => {
	const nft = await metaplex().nfts().createNft({
		name: 'My NFT',
		uri: 'https://example.org/123',
	});

	console.log(nft);

	t.pass();
});
