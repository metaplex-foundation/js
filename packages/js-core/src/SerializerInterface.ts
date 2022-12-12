import { Serializer } from './Serializer';

export interface SerializerInterface {
  u8: Serializer<number>;
  u16: Serializer<number>;
  u32: Serializer<number>;
  u64: Serializer<bigint>;
  u128: Serializer<bigint>;
  u256: Serializer<bigint>;
}
