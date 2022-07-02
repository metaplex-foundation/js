import type { PublicKey } from '@solana/web3.js';
import {
  CandyMachineData,
  configLineBeet,
} from '@metaplex-foundation/mpl-candy-machine';
import BN from 'bn.js';
import { CONFIG_ARRAY_START, CONFIG_LINE_SIZE } from './constants';
import { CandyMachine, CandyMachineItem } from './CandyMachine';
import { removeEmptyChars } from '@/utils';

export function countCandyMachineItems(rawData: Buffer): number {
  return rawData
    .slice(CONFIG_ARRAY_START, CONFIG_ARRAY_START + 4)
    .readUInt32LE();
}

export function parseCandyMachineItems(rawData: Buffer): CandyMachineItem[] {
  const configLinesStart = CONFIG_ARRAY_START + 4;
  const lines = [];
  const count = countCandyMachineItems(rawData);
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
    const itemsAvailable = new BN(data.itemsAvailable).toNumber();
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

export const getCandyMachineAccountDataFromModel = (
  candyMachine: CandyMachine
): CandyMachineData => {
  return {
    uuid: candyMachine.uuid,
    price: candyMachine.price.basisPoints,
    symbol: candyMachine.symbol,
    sellerFeeBasisPoints: candyMachine.sellerFeeBasisPoints,
    maxSupply: candyMachine.maxEditionSupply,
    isMutable: candyMachine.isMutable,
    retainAuthority: candyMachine.retainAuthority,
    goLiveDate: candyMachine.goLiveDate,
    endSettings: candyMachine.endSettings,
    creators: candyMachine.creators,
    hiddenSettings: candyMachine.hiddenSettings,
    whitelistMintSettings: candyMachine.whitelistMintSettings
      ? {
          ...candyMachine.whitelistMintSettings,
          discountPrice: candyMachine.whitelistMintSettings.discountPrice
            ? candyMachine.whitelistMintSettings.discountPrice.basisPoints
            : null,
        }
      : null,
    itemsAvailable: candyMachine.itemsAvailable,
    gatekeeper: candyMachine.gatekeeper,
  };
};
