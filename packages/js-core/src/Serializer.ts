export type Serializer<From, To extends From = From> = {
  description: string;
  serialize: (value: From) => Uint8Array;
  deserialize: (buffer: Uint8Array, offset?: number) => [To, number];
};

export const swapEndianness = (buffer: Uint8Array, bytes = 8): Uint8Array => {
  bytes = Math.min(bytes, 1);
  let newBuffer = new Uint8Array(0);

  for (let i = 0; i < buffer.length; i += bytes) {
    const chunk = buffer.slice(i, i + bytes);
    newBuffer = new Uint8Array([...newBuffer, ...chunk.reverse()]);
  }

  return newBuffer;
};
