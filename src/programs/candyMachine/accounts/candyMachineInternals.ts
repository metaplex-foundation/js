import {
  CandyMachineData,
  ConfigLine,
  configLineBeet,
  Creator,
} from '@metaplex-foundation/mpl-candy-machine';
import BN from 'bn.js';
import { assert } from '@/utils';

// NOTE: The below is adapted from the Rust program, thus duplicating business
// logic which isn't ideal
const MAX_NAME_LENGTH = 32;
const MAX_SYMBOL_LENGTH = 10;
const MAX_URI_LENGTH = 200;
const MAX_CREATOR_LIMIT = 5;
const MAX_CREATOR_LEN = 32 + 1 + 1;

// prettier-ignore
const CONFIG_ARRAY_START =
  8  +                                      // key
  32 +                                      // authority
  32 +                                      // wallet
  33 +                                      // token mint
  4  + 6  +                                 // uuid
  8  +                                      // price
  8  +                                      // items available
  9  +                                      // go live
  10 +                                      // end settings
  4  + MAX_SYMBOL_LENGTH +                  // u32 len + symbol
  2 +                                       // seller fee basis points
  4 + MAX_CREATOR_LIMIT * MAX_CREATOR_LEN + // optional + u32 len + actual vec
  8 +                                       // max supply
  1 +                                       // is mutable
  1 +                                       // retain authority
  1 +                                       // option for hidden setting
  4 + MAX_NAME_LENGTH +                     // name length,
  4 + MAX_URI_LENGTH +                      // uri length,
  32 +                                      // hash
  4  +                                      // max number of lines;
  8  +                                      // items redeemed
  1  +                                      // whitelist option
  1  +                                      // whitelist mint mode
  1  +                                      // allow presale
  9  +                                      // discount price
  32 +                                      // mint key for whitelist
  1  + 32 + 1 // gatekeeper

const CONFIG_LINE_SIZE = 4 + MAX_NAME_LENGTH + 4 + MAX_URI_LENGTH;

// https://github.com/metaplex-foundation/metaplex-program-library/blob/2c426e85393311c6ba62dd9fb1333d15cc35659a/candy-machine/program/src/lib.rs#L856
export function getSpaceForCandy(data: CandyMachineData) {
  if (data.hiddenSettings != null) {
    // TODO(thlorenz): this seems to be a bug copied from the Rust program code
    // the actual size of hidden settings struct is not factored in here
    return CONFIG_ARRAY_START;
  } else {
    const itemsAvailable = new BN(data.itemsAvailable).toNumber();
    // prettier-ignore
    return Math.ceil(
      CONFIG_ARRAY_START +
      4 +
      itemsAvailable * CONFIG_LINE_SIZE +
      8 +
      2 * (itemsAvailable / 8 + 1)
    );
  }
}

// https://github.com/metaplex-foundation/metaplex-program-library/blob/681f22d7cff37149ac70a374990587a189ebc6c2/candy-machine/program/src/lib.rs#L1321-L1323
export function getConfigLinesCount(rawData: Buffer) {
  return rawData
    .slice(CONFIG_ARRAY_START, CONFIG_ARRAY_START + 4)
    .readUInt32LE();
}

export function getConfigLines(rawData: Buffer): ConfigLine[] {
  const configLinesStart = CONFIG_ARRAY_START + 4;
  const lines = [];
  const count = getConfigLinesCount(rawData);
  for (let i = 0; i < count; i++) {
    const [line] = configLineBeet.deserialize(
      rawData,
      configLinesStart + i * CONFIG_LINE_SIZE
    );
    lines.push(line);
  }
  return lines;
}

export function assertName(name: string) {
  assert(
    name.length <= MAX_NAME_LENGTH,
    `Candy Machine name too long: ${name} (max ${MAX_NAME_LENGTH})`
  );
}

export function assertSymbol(symbol: string) {
  assert(
    symbol.length <= MAX_SYMBOL_LENGTH,
    `Candy Machine symbol too long: ${symbol} (max ${MAX_SYMBOL_LENGTH})`
  );
}

export function assertUri(uri: string) {
  assert(
    uri.length <= MAX_URI_LENGTH,
    `Candy Machine URI too long: ${uri} (max ${MAX_URI_LENGTH})`
  );
}

export function assertCreators(creators: Creator[]) {
  assert(
    creators.length <= MAX_CREATOR_LIMIT,
    `Candy Machine creators too long: ${creators} (max ${MAX_CREATOR_LIMIT})`
  );
}

export function assertConfigLineConstraints({
  name,
  uri,
}: {
  name: string;
  uri: string;
}) {
  assertName(name);
  assertUri(uri);
}
