import { BigIntInput, toBigInt } from './Amount';
import { assert, Opaque, Option } from '@/utils';

export type DateTimeString = string;
export type DateTimeValues = DateTimeString | BigIntInput | Date;
export type DateTime = Opaque<bigint, 'DateTime'>;

export const toDateTime = (value: DateTimeValues): DateTime => {
  if (typeof value === 'string' || isDateObject(value)) {
    const date = new Date(value);
    const timestamp = Math.floor(date.getTime() / 1000);
    return toBigInt(timestamp) as DateTime;
  }

  return toBigInt(value) as DateTime;
};

export const now = (): DateTime => toDateTime(new Date(Date.now()));

export const toOptionDateTime = (
  value: Option<DateTimeValues>
): Option<DateTime> => {
  return value === null ? null : toDateTime(value);
};

export const isDateTime = (value: any): value is DateTime => {
  return value?.__opaque__ === 'DateTime';
};

export function assertDateTime(value: any): asserts value is DateTime {
  assert(isDateTime(value), 'Expected DateTime type');
}

const isDateObject = (value: any): value is Date => {
  return Object.prototype.toString.call(value) === '[object Date]';
};

export const formatDateTime = (
  value: DateTime,
  // @ts-ignore
  locales: Intl.LocalesArgument = 'en-US',
  // @ts-ignore
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }
): string => {
  const date = new Date((value * toBigInt(1000)).toString());

  return date.toLocaleDateString(locales, options);
};
