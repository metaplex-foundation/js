import { PublicKey } from '@solana/web3.js';
import { NewOperation, useOperation } from '@/shared';
import { Nft } from '../models';

export const findNftsByCandyMachineOperation = useOperation<FindNftsByCandyMachineOperation>(
  'FindNftsByCandyMachineOperation'
);

export type FindNftsByCandyMachineOperation = NewOperation<
  'FindNftsByCandyMachineOperation',
  FindNftsByCandyMachineInput,
  Nft[]
>;

export interface FindNftsByCandyMachineInput {
  candyMachine: PublicKey;
  version?: 1 | 2;
}
