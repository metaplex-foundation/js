import { PublicKey } from '@solana/web3.js';
import { NewOperation, useOperation } from '@/shared';
import { Nft } from '../models';

export const findNftsByOwnerOperation = useOperation<FindNftsByOwnerOperation>(
  'FindNftsByOwnerOperation'
);

export type FindNftsByOwnerOperation = NewOperation<'FindNftsByOwnerOperation', PublicKey, Nft[]>;
