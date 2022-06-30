import {
  CandyMachineAddConfigConstraintsViolatedError,
  CandyMachineCannotAddAmountError,
  CandyMachineIsFullError,
} from '@/errors';
import type { CandyMachine } from './CandyMachine';
import { ConfigLine, Creator } from '@metaplex-foundation/mpl-candy-machine';
import { assertConfigLineConstraints } from './internals';
import BN from 'bn.js';

export function creatorsToJsonMetadataCreators(creators: Creator[]) {
  return creators.map((creator: Creator) => ({
    address: creator.address.toBase58(),
    share: creator.share,
    verified: creator.verified,
  }));
}

export function assertNotFull(candyMachine: CandyMachine, index: number) {
  if (candyMachine.isFull) {
    throw new CandyMachineIsFullError(index, candyMachine.maxSupply);
  }
}

export function assertCanAdd(
  candyMachine: CandyMachine,
  index: number | BN,
  amount: number | BN
) {
  index = new BN(index);
  amount = new BN(amount);
  const newTotal = index.add(amount);

  if (newTotal.gt(candyMachine.maxSupply)) {
    throw new CandyMachineCannotAddAmountError(
      index.toNumber(),
      amount.toNumber(),
      candyMachine.maxSupply
    );
  }
}

export function assertAllConfigLineConstraints(configLines: ConfigLine[]) {
  for (let i = 0; i < configLines.length; i++) {
    try {
      assertConfigLineConstraints(configLines[i]);
    } catch (err: any) {
      throw new CandyMachineAddConfigConstraintsViolatedError(
        i,
        configLines[i],
        err
      );
    }
  }
}
