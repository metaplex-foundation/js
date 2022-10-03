import * as nodeFetch from 'node-fetch';

export * from 'node-fetch';
export async function fetch(
  input: nodeFetch.RequestInfo,
  init?: nodeFetch.RequestInit
): Promise<nodeFetch.Response> {
  const processedInput =
    typeof input === 'string' && input.slice(0, 2) === '//'
      ? 'https:' + input
      : input;
  return await nodeFetch.default(processedInput, init);
}
