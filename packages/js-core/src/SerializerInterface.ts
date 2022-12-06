import { BasisPoint } from './Amount';
import { Serializer } from './Serializer';

export interface SerializerInterface {
  u8: Serializer<number>;
  u16: Serializer<number>;
  u32: Serializer<number>;
  u64: Serializer<BasisPoint>;
  u128: Serializer<BasisPoint>;
  u256: Serializer<BasisPoint>;
}
