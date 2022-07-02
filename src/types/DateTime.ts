import BN from 'bn.js';

export type DateTimeString = string;
export type DateTimeTimestamp = BN | number;
export type DateTime = DateTimeString | DateTimeTimestamp | Date;

/**
 * Tries to convert the {@link dateTime} to a big number representing time since epoch in
 * seconds. {@see https://www.epoch101.com/}
 *
 * @throws {@link Error} if the {@link dateTime} is not a valid date/time.
 * @private
 */
export function toUnixTimestamp(dateTime: DateTime): BN {
  if (BN.isBN(dateTime) || typeof dateTime === 'number') {
    return new BN(dateTime);
  }

  const date = new Date(dateTime);
  const timestamp = Math.floor(date.getTime() / 1000);
  return new BN(timestamp);
}
