import { CandyMachineItem } from './models';
import { removeEmptyChars } from '@/utils';
import { toBigNumber } from '@/types';
import { CANDY_MACHINE_HIDDEN_SECTION } from './constants';
import { u32 } from '@metaplex-foundation/beet';
import { CandyMachineData } from '@metaplex-foundation/mpl-candy-machine-core';

export function countCandyMachineItems(buffer: Buffer): number {
  const offset = CANDY_MACHINE_HIDDEN_SECTION;
  return u32.read(buffer.slice(offset, offset + 4), 0);
}

type CandyMachineHiddenSection = {
  itemsLoaded: number;
  items: CandyMachineItem[];
  itemsLoadedMap: boolean[];
  itemsMintIndicesMap: number[];
};

export const deserializeCandyMachineHiddenSection = (
  buffer: Buffer
): CandyMachineHiddenSection => {
  let offset = 0;
  const itemsLoaded = u32.read(buffer, offset);
  offset += 4;

  const configLinesStart = CONFIG_ARRAY_START + 4;
  const lines = [];
  const count = countCandyMachineItems(buffer);
  for (let i = 0; i < count; i++) {
    const [line] = configLineBeet.deserialize(
      buffer,
      configLinesStart + i * CONFIG_LINE_SIZE
    );
    lines.push({
      name: removeEmptyChars(line.name),
      uri: removeEmptyChars(line.uri),
    });
  }
  return { itemsLoaded };
};

export const getCandyMachineSize = (data: CandyMachineData): number => {
  if (data.hiddenSettings) {
    return CANDY_MACHINE_HIDDEN_SECTION;
  }

  const itemsAvailable = toBigNumber(data.itemsAvailable).toNumber();
  const configLineSize = getCandyMachineConfigLineSize(data);

  return Math.ceil(
    CANDY_MACHINE_HIDDEN_SECTION +
      // Number of currently items inserted.
      4 +
      // Config line data.
      itemsAvailable * configLineSize +
      // Bit mask to keep track of which ConfigLines have been added.
      (4 + Math.floor(itemsAvailable / 8) + 1) +
      // Mint indices.
      (4 + itemsAvailable * 4)
  );
};

export const getCandyMachineConfigLineSize = (data: CandyMachineData): number =>
  data.configLineSettings
    ? data.configLineSettings.nameLength + data.configLineSettings.uriLength
    : 0;
