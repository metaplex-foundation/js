import { Operation } from '../../../shared/index.js';
import { PublicKey } from '@solana/web3.js';
import { Nft } from '../models/index.js';

export class FindNftsByMintListOperation extends Operation<PublicKey[], (Nft | null)[]> {}
