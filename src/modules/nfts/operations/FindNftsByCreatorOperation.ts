import { Operation } from '@/shared';
import { PublicKey } from '@solana/web3.js';
import { Nft } from '../models';

export class FindNftsByCreatorOperation extends Operation<FindNftsByCreatorInput, Nft[]> {}

export interface FindNftsByCreatorInput {
  creator: PublicKey;
  position?: number;
}
