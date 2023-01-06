import {
  DelegateArgs,
  DelegateRole,
} from '@metaplex-foundation/mpl-token-metadata';
import { DelegateRoleRequiredDataError } from '..';
import { UnreachableCaseError } from '@/errors';

export type DelegateType = MetadataDelegateType | HolderDelegateType;
export type HolderDelegateType = 'TransferV1' | 'UtilityV1' | 'SaleV1';
export type MetadataDelegateType =
  | 'AuthorityV1'
  | 'CollectionV1'
  | 'UseV1'
  | 'UpdateV1';

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
  }
> = {
  AuthorityV1: { role: DelegateRole.Authority, seed: 'authority_delegate' },
  CollectionV1: { role: DelegateRole.Collection, seed: 'collection_delegate' },
  UseV1: { role: DelegateRole.Use, seed: 'use_delegate' },
  UpdateV1: { role: DelegateRole.Update, seed: 'update_delegate' },
  TransferV1: { role: DelegateRole.Transfer, seed: 'persistent_delegate' },
  UtilityV1: { role: DelegateRole.Utility, seed: 'persistent_delegate' },
  SaleV1: { role: DelegateRole.Sale, seed: 'persistent_delegate' },
};

export const getDelegateRole = (type: DelegateType): DelegateRole => {
  const { role } = delegateTypeMap[type] ?? {};
  if (!role) throw new UnreachableCaseError(type as never);
  return role;
};

export const getDelegateRoleSeed = (type: DelegateType): DelegateRoleSeed => {
  const { seed } = delegateTypeMap[type] ?? {};
  if (!seed) throw new UnreachableCaseError(type as never);
  return seed;
};

export const getDefaultDelegateArgs = (type: DelegateType): DelegateArgs => {
  switch (type) {
    case 'AuthorityV1':
      throw new DelegateRoleRequiredDataError('Authority');
    case 'CollectionV1':
      return { __kind: 'CollectionV1' };
    case 'UseV1':
      throw new DelegateRoleRequiredDataError('Use');
    case 'UpdateV1':
      throw new DelegateRoleRequiredDataError('Update');
    case 'TransferV1':
      throw new DelegateRoleRequiredDataError('Transfer');
    case 'SaleV1':
      throw new DelegateRoleRequiredDataError('Sale');
    case 'UtilityV1':
      throw new DelegateRoleRequiredDataError('Utility');
    default:
      throw new UnreachableCaseError(type);
  }
};
