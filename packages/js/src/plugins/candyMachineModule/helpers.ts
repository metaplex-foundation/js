import { CandyMachineConfigLineSettings, CandyMachineItem } from './models';
import { assert, removeEmptyChars } from '@/utils';
import { toBigNumber } from '@/types';
import { CANDY_MACHINE_HIDDEN_SECTION } from './constants';
import { array as beetArray, u32 } from '@metaplex-foundation/beet';
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
  buffer: Buffer,
  itemsAvailable: number,
  configLineSettings: CandyMachineConfigLineSettings,
  offset: number = 0
): CandyMachineHiddenSection => {
  // Items loaded.
  const itemsLoaded = u32.read(buffer, offset);
  offset += 4;

  // Raw config lines.
  const configLineSize =
    configLineSettings.nameLength + configLineSettings.uriLength;
  const configLinesSize = configLineSize * itemsAvailable;
  const rawConfigLines = buffer.slice(offset, offset + configLinesSize);
  offset += configLinesSize;

  // Items loaded map.
  const itemsLoadedMap = beetArray(u32)
    .toFixedFromData(buffer, offset)
    .read(buffer, offset);
  offset += 4 + Math.floor(itemsAvailable / 8) + 1;

  // Config lines.
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

  // Mint indices map.
  const itemsMintIndicesMap = beetArray(u32)
    .toFixedFromData(buffer, offset)
    .read(buffer, offset);

  return {
    itemsLoaded,
    items,
    itemsLoadedMap,
    itemsMintIndicesMap,
  };
};

export const getCandyMachineSize = (data: CandyMachineData): number => {
  if (data.hiddenSettings) {
    return CANDY_MACHINE_HIDDEN_SECTION;
  }

  // This should not happen as the candy machine input type
  // ensures exactly on of them is provided.
  assert(
    !!data.configLineSettings,
    'No config line settings nor hidden settings were provided. ' +
      'Please provide one of them.'
  );

  const itemsAvailable = toBigNumber(data.itemsAvailable).toNumber();
  const configLineSize =
    data.configLineSettings.nameLength + data.configLineSettings.uriLength;

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
