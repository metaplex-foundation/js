import { Serializer } from './Serializer';

export interface SerializerInterface {
  u8: Serializer<number>;
  u16: Serializer<number>;
  u32: Serializer<number>;
  u64: Serializer<number | bigint, bigint>;
  u128: Serializer<number | bigint, bigint>;
  u256: Serializer<number | bigint, bigint>;
  struct: <From, To extends From = From>(
    description: string,
    fields: [string, Serializer<any>][]
  ) => Serializer<From, To>;
}
