import test, { Test } from 'tape';
import spok from 'spok';
import { metaplex, spokSamePubkey } from '../../utils';

test('it can create an NFT with minimum configuration', async (t: Test) => {
	// Given we have a Metaplex instance.
	const mx = await metaplex();

	// And we uploaded some metadata somewhere.
	const uri = await mx.storage().uploadJson({
		name: 'JSON NFT name',
		description: 'JSON NFT description',
	})

	// When we create a new NFT with minimum configuration.
	const nft = await mx.nfts().createNft({
		name: 'On-chain NFT name',
		uri,
	});

	// Then we created and retrieved the new NFT and it has appropriate defaults.
	spok(t, nft, {
		$topic: 'Created NFT',
		name: 'On-chain NFT name',
		uri: uri,
		json: {
			name: 'JSON NFT name',
			description: 'JSON NFT description',
		},
		sellerFeeBasisPoints: 500,
		primarySaleHappened: false,
		updateAuthority: spokSamePubkey(mx.identity().publicKey),
		creators: [
			{
				address: spokSamePubkey(mx.identity().publicKey),
				share: 100,
				verified: true,
			},
		],
		collection: null,
		uses: null,
	});
});
