import { Connection, Keypair } from "@solana/web3.js";
import { LOCALHOST, airdrop } from '@metaplex-foundation/amman';
import { Metaplex, keypairIdentity, mockStorage } from '@/index';

export const metaplex = async (solsToAirdrop: number = 100) => {
	const connection = new Connection(LOCALHOST, { commitment: 'singleGossip' });
	const wallet = Keypair.generate();
	const mx = Metaplex.make(connection)
		.use(keypairIdentity(wallet))
		.use(mockStorage());

	await airdrop(mx.connection, wallet.publicKey, solsToAirdrop);
	return mx;
}
