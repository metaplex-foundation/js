import { PublicKey } from '@solana/web3.js';
import { Operation, useOperation } from '../../../shared';
import { CandyMachine } from '../models';

const KEY = 'FindCandyMachineByAdddressOperation';

export const findCandyMachineByAdddressOperation =
  useOperation<FindCandyMachineByAdddressOperation>(KEY);

export type FindCandyMachineByAdddressOperation = Operation<
  typeof KEY,
  PublicKey,
  Promise<CandyMachine>
>;
