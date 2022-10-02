import { Creator } from '@metaplex-foundation/mpl-token-metadata';
import { assert } from '@/utils';
import {
  MAX_CREATOR_LIMIT,
  MAX_NAME_LENGTH,
  MAX_SYMBOL_LENGTH,
  MAX_URI_LENGTH,
} from './constants';
import { CandyMachine } from './models/CandyMachine';
import {
  CandyMachineAddItemConstraintsViolatedError,
  CandyMachineCannotAddAmountError,
  CandyMachineEndedError,
  CandyMachineIsEmptyError,
  CandyMachineIsFullError,
  CandyMachineNotLiveError,
} from './errors';
import {
  ConfigLine,
  EndSettingType,
} from '@metaplex-foundation/mpl-candy-machine';
import { BigNumber, now, Signer, toBigNumber } from '@/types';

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

export const assertNotFull = (
  candyMachine: Pick<CandyMachine, 'itemsAvailable' | 'itemsLoaded'>,
  index: BigNumber
) => {
  if (candyMachine.itemsAvailable.lte(candyMachine.itemsLoaded)) {
    throw new CandyMachineIsFullError(index, candyMachine.itemsAvailable);
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
    } catch (error) {
      throw new CandyMachineAddItemConstraintsViolatedError(
        toBigNumber(i),
        configLines[i],
        { cause: error as Error }
      );
    }
  }
};

export const assertCandyMachineIsLive = (
  candyMachine: Pick<CandyMachine, 'whitelistMintSettings' | 'goLiveDate'>
) => {
  const hasWhitelistPresale =
    candyMachine.whitelistMintSettings?.presale ?? false;

  if (hasWhitelistPresale) {
    return;
  }

  const liveDate = candyMachine.goLiveDate;

  if (!liveDate || liveDate.gte(now())) {
    throw new CandyMachineNotLiveError(liveDate);
  }
};

export const assertCandyMachineHasNotEnded = (
  candyMachine: Pick<CandyMachine, 'endSettings' | 'itemsMinted'>
) => {
  const endSettings = candyMachine.endSettings;

  if (!endSettings) {
    return;
  }

  const hasEndedByAmount =
    endSettings.endSettingType === EndSettingType.Amount &&
    candyMachine.itemsMinted.gte(endSettings.number);
  const hasEndedByDate =
    endSettings.endSettingType === EndSettingType.Date &&
    endSettings.date.lt(now());

  if (hasEndedByAmount || hasEndedByDate) {
    throw new CandyMachineEndedError(endSettings);
  }
};

export const assertCanMintCandyMachine = (
  candyMachine: Pick<
    CandyMachine,
    | 'authorityAddress'
    | 'itemsRemaining'
    | 'itemsAvailable'
    | 'itemsMinted'
    | 'whitelistMintSettings'
    | 'goLiveDate'
    | 'endSettings'
  >,
  payer: Signer
) => {
  assertNotEmpty(candyMachine);

  if (candyMachine.authorityAddress.equals(payer.publicKey)) {
    return;
  }

  assertCandyMachineIsLive(candyMachine);
  assertCandyMachineHasNotEnded(candyMachine);
};
