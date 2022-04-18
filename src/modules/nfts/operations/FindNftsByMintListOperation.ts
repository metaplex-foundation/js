import { PublicKey } from '@solana/web3.js';
import { NewOperation, useOperation } from '@/shared';
import { Nft } from '../models';

export const findNftsByMintListOperation = useOperation<FindNftsByMintListOperation>(
  'FindNftsByMintListOperation'
);

export type FindNftsByMintListOperation = NewOperation<
  'FindNftsByMintListOperation',
  PublicKey[],
  (Nft | null)[]
>;
