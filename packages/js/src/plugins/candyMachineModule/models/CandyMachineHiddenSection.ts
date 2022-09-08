import { CandyMachineConfigLineSettings, CandyMachineItem } from '..';
import { assert, removeEmptyChars } from '@/utils';
import { deserializeFeatureFlags, toBigNumber } from '@/types';
import { CANDY_MACHINE_HIDDEN_SECTION } from '../constants';
import { array as beetArray, u32 } from '@metaplex-foundation/beet';
import {
  CandyMachineData,
  configLineBeet,
} from '@metaplex-foundation/mpl-candy-machine-core';

/** @internal */
export type CandyMachineHiddenSection = {
  itemsLoaded: number;
  items: CandyMachineItem[];
  itemsLoadedMap: boolean[];
  itemsMintIndicesMap: number[];
};

/** @internal */
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
  offset += 4; // Skip the redundant size of the map.
  const [itemsLoadedMap] = deserializeFeatureFlags(
    buffer,
    itemsAvailable,
    offset
  );
  const itemsLoadedMapSize = Math.floor(itemsAvailable / 8) + 1;
  offset += itemsLoadedMapSize;

  // Parse config lines.
  const items: CandyMachineItem[] = [];
  itemsLoadedMap.forEach((loaded, index) => {
    if (!loaded) return;

    const [configLine] = configLineBeet.deserialize(
      rawConfigLines,
      index * configLineSize
    );
    const prefixName = replaceCandyMachineItemPattern(
      configLineSettings.prefixName,
      index
    );
    const prefixUri = replaceCandyMachineItemPattern(
      configLineSettings.prefixUri,
      index
    );

    items.push({
      index,
      name: prefixName + removeEmptyChars(configLine.name),
      uri: prefixUri + removeEmptyChars(configLine.uri),
    });
  });

  // Mint indices map.
  offset += 4; // Skip the redundant size of the map.
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

/** @internal */
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

/** @internal */
export const replaceCandyMachineItemPattern = (
  value: string,
  index: number
): string => {
  return value.replace('$ID+1$', `${index + 1}`).replace('$ID$', `${index}`);
};
