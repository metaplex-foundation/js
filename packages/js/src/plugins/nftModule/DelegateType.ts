import {
  DelegateArgs,
  DelegateRole,
} from '@metaplex-foundation/mpl-token-metadata';
import { DelegateRoleRequiredDataError } from './errors';
import { UnreachableCaseError } from '@/errors';

export type DelegateType = MetadataDelegateType | HolderDelegateType;
export type HolderDelegateType = 'TransferV1' | 'SaleV1';
// | 'UtilityV1'
export type MetadataDelegateType = 'CollectionV1';
// | 'AuthorityV1'
// | 'UseV1'
// | 'UpdateV1'

export const isHolderDelegateType = (
  type: DelegateType
): type is HolderDelegateType => {
  return ['TransferV1', 'SaleV1'].includes(type);
};

export const isMetadataDelegateType = (
  type: DelegateType
): type is MetadataDelegateType => {
  return ['CollectionV1'].includes(type);
};

export type DelegateRoleSeed =
  | 'authority_delegate'
  | 'collection_delegate'
  | 'use_delegate'
  | 'update_delegate'
  | 'persistent_delegate';

const delegateTypeMap: Record<
  DelegateType,
  {
    role: DelegateRole;
    seed: DelegateRoleSeed;
    hasData: boolean;
  }
> = {
  // AuthorityV1: { role: DelegateRole.Authority, seed: 'authority_delegate', hasData: false },
  CollectionV1: {
    role: DelegateRole.Collection,
    seed: 'collection_delegate',
    hasData: false,
  },
  // UseV1: { role: DelegateRole.Use, seed: 'use_delegate', hasData: false },
  // UpdateV1: { role: DelegateRole.Update, seed: 'update_delegate', hasData: false },
  TransferV1: {
    role: DelegateRole.Transfer,
    seed: 'persistent_delegate',
    hasData: true,
  },
  // UtilityV1: { role: DelegateRole.Utility, seed: 'persistent_delegate', hasData: false },
  SaleV1: {
    role: DelegateRole.Sale,
    seed: 'persistent_delegate',
    hasData: true,
  },
};

export const getDelegateRole = (type: DelegateType): DelegateRole => {
  const manifest = delegateTypeMap[type];
  if (!manifest) throw new UnreachableCaseError(type as never);
  return manifest.role;
};

export const getDelegateRoleSeed = (type: DelegateType): DelegateRoleSeed => {
  const manifest = delegateTypeMap[type];
  if (!manifest) throw new UnreachableCaseError(type as never);
  return manifest.seed;
};

export const getDefaultDelegateArgs = (type: DelegateType): DelegateArgs => {
  const manifest = delegateTypeMap[type];
  if (!manifest) throw new UnreachableCaseError(type as never);
  if (manifest.hasData) throw new DelegateRoleRequiredDataError(type);
  return { __kind: type } as DelegateArgs;
};
