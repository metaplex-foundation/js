// eslint-disable-next-line no-control-regex
export const removeEmptyChars = (value: string) => value.replace(/\u0000/g, '');

export const padEmptyChars = (value: string, chars: number) => value.padEnd(chars, '\u0000');

export const tryOr = <T, U>(callback: () => T, defaultValue: U): T | U => {
  try {
    return callback();
  } catch (error) {
    return defaultValue;
  }
}

export const tryOrNull = <T>(cb: () => T) => tryOr(cb, null);

export const zipMap = <T, U, V>(left: T[], right: U[], fn: (t: T, u: U | null, i: number) => V): V[] => (
  left.map((t: T, index) => fn(t, right?.[index] ?? null, index))
);

export const fetchJson = async <T>(uri: string): Promise<T | null> => {
  try {
    const response = await fetch(uri);
    const metadata: T = await response.json();
    return metadata;
  } catch (error) {
    return null;
  }
};
