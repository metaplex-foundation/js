export type Serializer<From, To extends From = From> = {
  description: string;
  serialize: (value: From) => Uint8Array;
  deserialize: (buffer: Uint8Array, offset?: number) => [To, number];
};
