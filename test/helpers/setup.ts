import { Keypair } from "@solana/web3.js";
import { LOCALHOST, airdrop } from '@metaplex-foundation/amman';
import { Metaplex, keypairIdentity, mockStorage } from '@/index';

export const metaplex = async (solsToAirdrop: number = 100) => {
	const wallet = Keypair.generate();
	const mx = Metaplex.make(LOCALHOST, { commitment: 'singleGossip' })
		.use(keypairIdentity(wallet))
		.use(mockStorage());

	await airdrop(mx.connection, wallet.publicKey, solsToAirdrop);
	return mx;
}
