export type Serializer<T> = {
  description: string;
  serialize: (value: T) => Uint8Array;
  deserialize: (buffer: Uint8Array, offset?: number) => [T, number];
};
