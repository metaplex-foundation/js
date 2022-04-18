import { PublicKey } from '@solana/web3.js';
import { useOperation } from '@/shared';
import { Nft } from '../models';

export const findNftsByOwnerOperation = useOperation<PublicKey, Nft[]>('findNftsByOwnerOperation');
