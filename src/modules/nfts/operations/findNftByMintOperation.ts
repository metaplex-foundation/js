import { Operation, useOperation } from '@/shared';
import { PublicKey } from '@solana/web3.js';
import { Nft } from '../models';

export const findNftByMintOperation =
  useOperation<FindNftByMintOperation>('FindNftByMintOperation');

export type FindNftByMintOperation = Operation<'FindNftByMintOperation', PublicKey, Nft>;
