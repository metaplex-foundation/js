export const removeNullCharacters = (value: string) =>
  value.replace(/\u0000/g, '');

export const padNullCharacters = (value: string, chars: number) =>
  value.padEnd(chars, '\u0000');
