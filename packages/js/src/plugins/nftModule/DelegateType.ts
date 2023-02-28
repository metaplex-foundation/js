import {
  DelegateArgs,
  TokenDelegateRole,
  MetadataDelegateRole,
} from '@metaplex-foundation/mpl-token-metadata';
import { DelegateRoleRequiredDataError } from './errors';
import { UnreachableCaseError } from '@/errors';

export type TokenDelegateType =
  | 'StandardV1'
  | 'TransferV1'
  | 'LockedTransferV1'
  | 'SaleV1'
  | 'UtilityV1'
  | 'StakingV1';
export type MetadataDelegateType =
  // | 'AuthorityV1'
  | 'CollectionV1'
  // | 'UseV1'
  | 'UpdateV1'
  | 'ProgrammableConfigV1';

const tokenDelegateRoleMap: Record<TokenDelegateType, TokenDelegateRole> = {
  StandardV1: TokenDelegateRole.Standard,
  TransferV1: TokenDelegateRole.Transfer,
  LockedTransferV1: TokenDelegateRole.LockedTransfer,
  SaleV1: TokenDelegateRole.Sale,
  UtilityV1: TokenDelegateRole.Utility,
  StakingV1: TokenDelegateRole.Staking,
};

const metadataDelegateRoleMap: Record<
  MetadataDelegateType,
  MetadataDelegateRole
> = {
  // AuthorityV1: MetadataDelegateRole.Authority,
  CollectionV1: MetadataDelegateRole.Collection,
  // UseV1: MetadataDelegateRole.Use,
  UpdateV1: MetadataDelegateRole.Update,
  ProgrammableConfigV1: MetadataDelegateRole.ProgrammableConfig,
};

const metadataDelegateSeedMap: Record<MetadataDelegateRole, string> = {
  [MetadataDelegateRole.Authority]: 'authority_delegate',
  [MetadataDelegateRole.Collection]: 'collection_delegate',
  [MetadataDelegateRole.Use]: 'use_delegate',
  [MetadataDelegateRole.Update]: 'update_delegate',
  [MetadataDelegateRole.ProgrammableConfig]: 'programmable_config_delegate',
};

const delegateCustomDataMap: Record<
  TokenDelegateType | MetadataDelegateType,
  boolean
> = {
  // Metadata.
  // AuthorityV1: false,
  CollectionV1: false,
  // UseV1: false,
  UpdateV1: false,
  ProgrammableConfigV1: false,
  // Token
  StandardV1: true,
  TransferV1: true,
  SaleV1: true,
  UtilityV1: true,
  StakingV1: true,
  LockedTransferV1: true,
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
