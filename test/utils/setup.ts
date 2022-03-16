import { Keypair } from "@solana/web3.js";
import { LOCALHOST, airdrop } from '@metaplex-foundation/amman';
import { Metaplex, keypairIdentity, mockStorage } from '../../src';

export const metaplex = async (solsToAirdrop: number = 100) => {
	const wallet = Keypair.generate();
	const mx = Metaplex.make(LOCALHOST, { commitment: 'singleGossip' })
		.setIdentity(keypairIdentity(wallet))
		.setStorage(mockStorage());

	await airdrop(mx.connection, wallet.publicKey, solsToAirdrop);
	return mx;
}
