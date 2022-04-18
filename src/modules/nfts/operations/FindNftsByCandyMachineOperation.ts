import { PublicKey } from '@solana/web3.js';
import { useOperation } from '@/shared';
import { Nft } from '../models';

export const findNftsByCandyMachineOperation = useOperation<FindNftsByCandyMachineInput, Nft[]>(
  'findNftsByCandyMachineOperation'
);

export interface FindNftsByCandyMachineInput {
  candyMachine: PublicKey;
  version?: 1 | 2;
}
