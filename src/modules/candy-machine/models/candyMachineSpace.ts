import { CandyMachineData } from '@metaplex-foundation/mpl-candy-machine';
import BN from 'bn.js';

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
