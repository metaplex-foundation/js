import test, { Test } from 'tape';
import spok from 'spok';
import { metaplex, spokSamePubkey } from '../../utils';

test('it can create an NFT with minimum configuration', async (t: Test) => {
	// Given we have a Metaplex instance.
	const mx = await metaplex();

	// When we create a new NFT with minimum configuration.
	const nft = await mx.nfts().createNft({
		name: 'My NFT',
		uri: 'https://example.org/123',
	});

	// Then we created and retrieved the new NFT and it has appropriate defaults.
	spok(t, nft, {
		$topic: 'Created NFT',
		name: 'My NFT',
		uri: 'https://example.org/123',
		json: null,
		sellerFeeBasisPoints: 500,
		primarySaleHappened: false,
		updateAuthority: spokSamePubkey(mx.identity().publicKey),
	});
});
