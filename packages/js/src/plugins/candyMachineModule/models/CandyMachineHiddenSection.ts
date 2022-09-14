import { deserializeFeatureFlags, toBigNumber } from '@/types';
import { assert, removeEmptyChars } from '@/utils';
import beet from '@metaplex-foundation/beet';
import { CandyMachineData } from '@metaplex-foundation/mpl-candy-machine-core';
import { CandyMachineConfigLineSettings, CandyMachineItem } from '..';
import { CANDY_MACHINE_HIDDEN_SECTION } from '../constants';

/** @internal */
export type CandyMachineHiddenSection = {
  itemsLoaded: number;
  items: CandyMachineItem[];
  itemsLoadedMap: boolean[];
  itemsLeftToMint: number[];
};

/** @internal */
export const deserializeCandyMachineHiddenSection = (
  buffer: Buffer,
  itemsAvailable: number,
  itemsRemaining: number,
  configLineSettings: CandyMachineConfigLineSettings,
  offset: number = 0
): CandyMachineHiddenSection => {
  // Items loaded.
  const itemsLoaded = beet.u32.read(buffer, offset);
  offset += 4;

  // Raw config lines.
  const nameLength = configLineSettings.nameLength;
  const uriLength = configLineSettings.uriLength;
  const configLineSize = nameLength + uriLength;
  const configLinesSize = configLineSize * itemsAvailable;
  const rawConfigLines = buffer.slice(offset, offset + configLinesSize);
  offset += configLinesSize;

  // Items loaded map.
  offset += 4; // Skip the redundant size of the map.
  const [itemsLoadedMap] = deserializeFeatureFlags(
    buffer,
    itemsAvailable,
    offset,
    false
  );
  const itemsLoadedMapSize = Math.floor(itemsAvailable / 8) + 1;
  offset += itemsLoadedMapSize;

  // Items left to mint.
  offset += 4; // Skip the redundant size of the map.
  const itemsLeftToMint = beet
    .uniformFixedSizeArray(beet.u32, itemsAvailable)
    .read(buffer, offset)
    .slice(0, itemsRemaining);

  // Parse config lines.
  const items: CandyMachineItem[] = [];
  itemsLoadedMap.forEach((loaded, index) => {
    if (!loaded) return;

    const namePosition = index * configLineSize;
    const uriPosition = namePosition + nameLength;
    const name = rawConfigLines
      .slice(namePosition, namePosition + nameLength)
      .toString('utf8');
    const uri = rawConfigLines
      .slice(uriPosition, uriPosition + uriLength)
      .toString('utf8');

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
      minted: !itemsLeftToMint.includes(index),
      name: prefixName + removeEmptyChars(name),
      uri: prefixUri + removeEmptyChars(uri),
    });
  });

  return {
    itemsLoaded,
    items,
    itemsLoadedMap,
    itemsLeftToMint,
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
