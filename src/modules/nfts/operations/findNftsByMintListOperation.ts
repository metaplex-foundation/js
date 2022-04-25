import { PublicKey } from '@solana/web3.js';
import { Operation, useOperation } from '@/shared';
import { Nft } from '../models';

export const findNftsByMintListOperation = useOperation<FindNftsByMintListOperation>(
  'FindNftsByMintListOperation'
);

export type FindNftsByMintListOperation = Operation<
  'FindNftsByMintListOperation',
  PublicKey[],
  (Nft | null)[]
>;
