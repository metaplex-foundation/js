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
    hasCustomData: boolean;
  }
> = {
  // AuthorityV1: { role: DelegateRole.Authority, seed: 'authority_delegate', hasCustomData: false },
  CollectionV1: {
    role: DelegateRole.Collection,
    seed: 'collection_delegate',
    hasCustomData: false,
  },
  // UseV1: { role: DelegateRole.Use, seed: 'use_delegate', hasCustomData: false },
  // UpdateV1: { role: DelegateRole.Update, seed: 'update_delegate', hasCustomData: false },
  TransferV1: {
    role: DelegateRole.Transfer,
    seed: 'persistent_delegate',
    hasCustomData: true,
  },
  // UtilityV1: { role: DelegateRole.Utility, seed: 'persistent_delegate', hasCustomData: false },
  SaleV1: {
    role: DelegateRole.Sale,
    seed: 'persistent_delegate',
    hasCustomData: true,
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

export const getDefaultDelegateArgs = (
  type: DelegateType
): Omit<DelegateArgs, 'authorizationData'> => {
  const manifest = delegateTypeMap[type];
  if (!manifest) throw new UnreachableCaseError(type as never);
  if (manifest.hasCustomData) throw new DelegateRoleRequiredDataError(type);
  return { __kind: type } as DelegateArgs;
};
