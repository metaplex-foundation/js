import { useOperation } from '@/shared';
import { PublicKey } from '@solana/web3.js';
import { Nft } from '../models';

export const findNftByMintOperation = useOperation<PublicKey, Nft>('findNftByMintOperation');
