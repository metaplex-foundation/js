import { Serializer } from './Serializer';

export interface SerializerInterface {
  u8: Serializer<number>;
  u16: Serializer<number>;
  u32: Serializer<number>;
  u64: Serializer<number>;
  u128: Serializer<number>;
  u256: Serializer<number>;
}
