import { PublicKey } from '@solana/web3.js';
import { Operation } from '@/shared';
import { Nft } from '../models';

export class FindNftsByCandyMachineOperation extends Operation<
  FindNftsByCandyMachineInput,
  Nft[]
> {}

export interface FindNftsByCandyMachineInput {
  candyMachine: PublicKey;
  version?: 1 | 2;
}
