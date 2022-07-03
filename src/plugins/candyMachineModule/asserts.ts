import { Creator } from '@metaplex-foundation/mpl-token-metadata';
import { assert } from '@/utils';
import {
  MAX_CREATOR_LIMIT,
  MAX_NAME_LENGTH,
  MAX_SYMBOL_LENGTH,
  MAX_URI_LENGTH,
} from './constants';
import { CandyMachine } from './CandyMachine';
import {
  CandyMachineAddItemConstraintsViolatedError,
  CandyMachineCannotAddAmountError,
  CandyMachineIsFullError,
} from './errors';
import { ConfigLine } from '@metaplex-foundation/mpl-candy-machine';
import { BigNumber, toBigNumber } from '@/types';

export const assertName = (name: string) => {
  assert(
    name.length <= MAX_NAME_LENGTH,
    `Candy Machine name too long: ${name} (max ${MAX_NAME_LENGTH})`
  );
};

export const assertSymbol = (symbol: string) => {
  assert(
    symbol.length <= MAX_SYMBOL_LENGTH,
    `Candy Machine symbol too long: ${symbol} (max ${MAX_SYMBOL_LENGTH})`
  );
};

export const assertUri = (uri: string) => {
  assert(
    uri.length <= MAX_URI_LENGTH,
    `Candy Machine URI too long: ${uri} (max ${MAX_URI_LENGTH})`
  );
};

export const assertCreators = (creators: Creator[]) => {
  assert(
    creators.length <= MAX_CREATOR_LIMIT,
    `Candy Machine creators too long: ${creators} (max ${MAX_CREATOR_LIMIT})`
  );
};

export const assertNotFull = (candyMachine: CandyMachine, index: BigNumber) => {
  if (candyMachine.isFullyLoaded) {
    throw new CandyMachineIsFullError(index, candyMachine.itemsAvailable);
  }
};

export const assertCanAdd = (
  candyMachine: CandyMachine,
  index: BigNumber,
  amount: number
) => {
  if (index.addn(amount).gt(candyMachine.itemsAvailable)) {
    throw new CandyMachineCannotAddAmountError(
      index,
      amount,
      candyMachine.itemsAvailable
    );
  }
};

export const assertAllConfigLineConstraints = (configLines: ConfigLine[]) => {
  for (let i = 0; i < configLines.length; i++) {
    try {
      assertName(configLines[i].name);
      assertUri(configLines[i].uri);
    } catch (err: any) {
      throw new CandyMachineAddItemConstraintsViolatedError(
        toBigNumber(i),
        configLines[i],
        err
      );
    }
  }
};
