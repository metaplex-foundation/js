import type { PublicKey } from '@solana/web3.js';
import {
  CandyMachineData,
  configLineBeet,
} from '@metaplex-foundation/mpl-candy-machine';
import { CONFIG_ARRAY_START, CONFIG_LINE_SIZE } from './constants';
import { CandyMachineItem } from './models';
import { removeEmptyChars } from '@/utils';
import { BigNumber, toBigNumber } from '@/types';

export function countCandyMachineItems(rawData: Buffer): BigNumber {
  const number = rawData.slice(CONFIG_ARRAY_START, CONFIG_ARRAY_START + 4);
  return toBigNumber(number, 'le');
}

export function parseCandyMachineItems(rawData: Buffer): CandyMachineItem[] {
  const configLinesStart = CONFIG_ARRAY_START + 4;
  const lines = [];
  const count = countCandyMachineItems(rawData).toNumber();
  for (let i = 0; i < count; i++) {
    const [line] = configLineBeet.deserialize(
      rawData,
      configLinesStart + i * CONFIG_LINE_SIZE
    );
    lines.push({
      name: removeEmptyChars(line.name),
      uri: removeEmptyChars(line.uri),
    });
  }
  return lines;
}

export function getCandyMachineAccountSizeFromData(data: CandyMachineData) {
  if (data.hiddenSettings != null) {
    return CONFIG_ARRAY_START;
  } else {
    const itemsAvailable = toBigNumber(data.itemsAvailable).toNumber();
    return Math.ceil(
      CONFIG_ARRAY_START +
        4 +
        itemsAvailable * CONFIG_LINE_SIZE +
        8 +
        2 * (itemsAvailable / 8 + 1)
    );
  }
}

export const getCandyMachineUuidFromAddress = (
  candyMachineAddress: PublicKey
): string => {
  return candyMachineAddress.toBase58().slice(0, 6);
};
