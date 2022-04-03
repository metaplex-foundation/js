import { Operation } from '@/shared';
import { PublicKey } from '@solana/web3.js';
import { Nft } from '../models';

export class FindNftByMintOperation extends Operation<PublicKey, Nft> {}
