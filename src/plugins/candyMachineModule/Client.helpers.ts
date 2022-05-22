import {
  CandyMachineAddConfigConstraintsViolatedError,
  CandyMachineCannotAddAmountError,
  CandyMachineIsFullError,
} from '@/errors';
import { CandyMachine } from './CandyMachine';
import { ConfigLine, Creator } from '@metaplex-foundation/mpl-candy-machine';
import { CandyMachineAccount } from '../../programs/candyMachine';

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
  index: number,
  amount: number
) {
  if (index + amount > candyMachine.maxSupply) {
    throw new CandyMachineCannotAddAmountError(
      index,
      amount,
      candyMachine.maxSupply
    );
  }
}

export function assertAllConfigLineConstraints(configLines: ConfigLine[]) {
  for (let i = 0; i < configLines.length; i++) {
    assertConfigLineConstraints(configLines[i], i);
  }
}

function assertConfigLineConstraints(configLine: ConfigLine, index: number) {
  try {
    CandyMachineAccount.assertConfigLineConstraints(configLine);
  } catch (err: any) {
    throw new CandyMachineAddConfigConstraintsViolatedError(
      index,
      configLine,
      err
    );
  }
}
