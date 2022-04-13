import { Operation } from '@/shared/index';
import { PublicKey } from '@solana/web3.js';
import { Nft } from '../models/index';

export class FindNftsByMintListOperation extends Operation<PublicKey[], (Nft | null)[]> {}
