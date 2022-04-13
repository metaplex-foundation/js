import { PublicKey } from '@solana/web3.js';
import { Operation } from '@/shared/index';
import { Nft } from '../models/index';

export class FindNftsByCandyMachineOperation extends Operation<
  FindNftsByCandyMachineInput,
  Nft[]
> {}

export interface FindNftsByCandyMachineInput {
  candyMachine: PublicKey;
  version?: 1 | 2;
}
