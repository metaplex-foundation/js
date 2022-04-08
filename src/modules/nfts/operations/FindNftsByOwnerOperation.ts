import { Operation } from '@/shared';
import { PublicKey } from '@solana/web3.js';
import { Nft } from '../models';

export class FindNftsByOwnerOperation extends Operation<PublicKey, Nft[]> {}
