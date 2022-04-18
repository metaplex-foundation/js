import { PublicKey } from '@solana/web3.js';
import { NewOperation, useOperation } from '@/shared';
import { Nft } from '../models';

export const findNftsByCreatorOperation = useOperation<FindNftsByCreatorOperation>(
  'FindNftsByCreatorOperation'
);

export type FindNftsByCreatorOperation = NewOperation<
  'FindNftsByCreatorOperation',
  FindNftsByCreatorInput,
  Nft[]
>;

export interface FindNftsByCreatorInput {
  creator: PublicKey;
  position?: number;
}
