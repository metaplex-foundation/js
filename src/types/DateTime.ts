import BN from 'bn.js';
import { Opaque } from '@/utils';
import { BigNumberValues } from './BigNumber';

export type DateTimeString = string;
export type DateTimeValues = DateTimeString | BigNumberValues | Date;
export type DateTime = Opaque<BN, 'DateTime'>;

export const toDateTime = (value: DateTimeValues): DateTime => {
  if (typeof value === 'string' || isDateObject(value)) {
    const date = new Date(value);
    const timestamp = Math.floor(date.getTime() / 1000);
    return new BN(timestamp) as DateTime;
  }

  return new BN(value) as DateTime;
};

const isDateObject = (value: any): value is Date => {
  return Object.prototype.toString.call(value) === '[object Date]';
};
