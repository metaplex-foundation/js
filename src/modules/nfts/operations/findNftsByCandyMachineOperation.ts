import { PublicKey } from '@solana/web3.js';
import { Operation, useOperation } from '@/shared';
import { Nft } from '../models';

export const findNftsByCandyMachineOperation = useOperation<FindNftsByCandyMachineOperation>(
  'FindNftsByCandyMachineOperation'
);

export type FindNftsByCandyMachineOperation = Operation<
  'FindNftsByCandyMachineOperation',
  FindNftsByCandyMachineInput,
  Nft[]
>;

export interface FindNftsByCandyMachineInput {
  candyMachine: PublicKey;
  version?: 1 | 2;
}
