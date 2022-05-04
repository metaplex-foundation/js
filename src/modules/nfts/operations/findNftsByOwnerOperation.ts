import { PublicKey } from '@solana/web3.js';
import { Operation, useOperation } from '@/drivers';
import { Nft } from '../models';

export const findNftsByOwnerOperation = useOperation<FindNftsByOwnerOperation>(
  'FindNftsByOwnerOperation'
);

export type FindNftsByOwnerOperation = Operation<'FindNftsByOwnerOperation', PublicKey, Nft[]>;
