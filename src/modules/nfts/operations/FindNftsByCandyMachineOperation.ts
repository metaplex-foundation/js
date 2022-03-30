import { PublicKey } from '@solana/web3.js';
import { Operation } from '@/modules/shared';
import { Nft } from '../models';

export class FindNftsByCandyMachineOperation extends Operation<
  FindNftsByCandyMachineInput,
  Nft[]
> {}

export interface FindNftsByCandyMachineInput {
  v1?: PublicKey;
  v2?: PublicKey;
}
