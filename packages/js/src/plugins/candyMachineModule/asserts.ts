import { CandyMachine, CandyMachineItem } from './models';
import {
  CandyMachineItemTextTooLongError,
  CandyMachineCannotAddAmountError,
  CandyMachineIsEmptyError,
  CandyMachineIsFullError,
} from './errors';

export const assertNotFull = (
  candyMachine: Pick<CandyMachine, 'itemsAvailable' | 'itemsLoaded'>,
  index: number
) => {
  if (candyMachine.itemsAvailable.lten(candyMachine.itemsLoaded)) {
    throw new CandyMachineIsFullError(
      index,
      candyMachine.itemsAvailable.toNumber()
    );
  }
};

export const assertNotEmpty = (
  candyMachine: Pick<CandyMachine, 'itemsRemaining' | 'itemsAvailable'>
) => {
  if (candyMachine.itemsRemaining.isZero()) {
    throw new CandyMachineIsEmptyError(candyMachine.itemsAvailable);
  }
};

export const assertCanAdd = (
  candyMachine: Pick<CandyMachine, 'itemsAvailable'>,
  index: number,
  amount: number
) => {
  if (index + amount > candyMachine.itemsAvailable.toNumber()) {
    throw new CandyMachineCannotAddAmountError(
      index,
      amount,
      candyMachine.itemsAvailable.toNumber()
    );
  }
};

export const assertAllItemConstraints = (
  candyMachine: Pick<CandyMachine, 'itemSettings'>,
  items: Pick<CandyMachineItem, 'name' | 'uri'>[]
) => {
  if (candyMachine.itemSettings.type !== 'configLines') {
    return;
  }

  const nameLength = candyMachine.itemSettings.nameLength;
  const uriLength = candyMachine.itemSettings.uriLength;

  for (let i = 0; i < items.length; i++) {
    if (items[i].name.length > nameLength) {
      throw new CandyMachineItemTextTooLongError(
        i,
        'name',
        items[i].name,
        nameLength
      );
    }
    if (items[i].uri.length > uriLength) {
      throw new CandyMachineItemTextTooLongError(
        i,
        'uri',
        items[i].uri,
        uriLength
      );
    }
  }
};
