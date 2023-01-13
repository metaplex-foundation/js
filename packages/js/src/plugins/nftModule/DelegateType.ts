import {
  DelegateArgs,
  TokenDelegateRole,
  MetadataDelegateRole,
} from '@metaplex-foundation/mpl-token-metadata';
import { DelegateRoleRequiredDataError } from './errors';
import { UnreachableCaseError } from '@/errors';

export type TokenDelegateType = 'TransferV1' | 'SaleV1' | 'UtilityV1';
export type MetadataDelegateType = 'CollectionV1' | 'UpdateV1'; // | 'AuthorityV1' | 'UseV1'

const tokenDelegateRoleMap: Record<TokenDelegateType, TokenDelegateRole> = {
  TransferV1: TokenDelegateRole.Transfer,
  SaleV1: TokenDelegateRole.Sale,
  UtilityV1: TokenDelegateRole.Utility,
};

const metadataDelegateRoleMap: Record<
  MetadataDelegateType,
  MetadataDelegateRole
> = {
  CollectionV1: MetadataDelegateRole.Collection,
  UpdateV1: MetadataDelegateRole.Update,
};

const metadataDelegateSeedMap: Record<MetadataDelegateRole, string> = {
  [MetadataDelegateRole.Authority]: 'authority_delegate',
  [MetadataDelegateRole.Collection]: 'collection_delegate',
  [MetadataDelegateRole.Use]: 'use_delegate',
  [MetadataDelegateRole.Update]: 'update_delegate',
};

const delegateCustomDataMap: Record<
  TokenDelegateType | MetadataDelegateType,
  boolean
> = {
  // AuthorityV1: false,
  CollectionV1: false,
  SaleV1: true,
  TransferV1: true,
  // UseV1: false,
  UpdateV1: false,
  UtilityV1: false,
};

export const getTokenDelegateRole = (
  type: TokenDelegateType
): TokenDelegateRole => {
  const role = tokenDelegateRoleMap[type];
  if (!role) throw new UnreachableCaseError(type as never);
  return role;
};

export const getMetadataDelegateRole = (
  type: MetadataDelegateType
): MetadataDelegateRole => {
  const role = metadataDelegateRoleMap[type];
  if (!role) throw new UnreachableCaseError(type as never);
  return role;
};

export const getMetadataDelegateRoleSeed = (
  type: MetadataDelegateType
): string => {
  return metadataDelegateSeedMap[getMetadataDelegateRole(type)];
};

export const getDefaultDelegateArgs = (
  type: TokenDelegateType | MetadataDelegateType
): Omit<DelegateArgs, 'authorizationData'> => {
  const hasCustomData = delegateCustomDataMap[type];
  if (hasCustomData === undefined)
    throw new UnreachableCaseError(type as never);
  if (hasCustomData) throw new DelegateRoleRequiredDataError(type);
  return { __kind: type } as DelegateArgs;
};
