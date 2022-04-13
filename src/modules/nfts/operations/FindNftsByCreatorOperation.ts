import { Operation } from '@/shared/index';
import { PublicKey } from '@solana/web3.js';
import { Nft } from '../models/index';

export class FindNftsByCreatorOperation extends Operation<FindNftsByCreatorInput, Nft[]> {}

export interface FindNftsByCreatorInput {
  creator: PublicKey;
  position?: number;
}
