import { Operation } from '@/shared/index';
import { PublicKey } from '@solana/web3.js';
import { Nft } from '../models/index';

export class FindNftByMintOperation extends Operation<PublicKey, Nft> {}
