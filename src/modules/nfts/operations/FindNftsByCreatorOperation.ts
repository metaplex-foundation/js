import { PublicKey } from '@solana/web3.js';
import { useOperation } from '@/shared';
import { Nft } from '../models';

export const findNftsByCreatorOperation = useOperation<FindNftsByCreatorInput, Nft[]>(
  'findNftsByCreatorOperation'
);

export interface FindNftsByCreatorInput {
  creator: PublicKey;
  position?: number;
}
