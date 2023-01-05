import { DelegateRole } from '@metaplex-foundation/mpl-token-metadata';
import { UnreachableCaseError } from '@/errors';

export { DelegateRole };

export type DelegateRoleSeed =
  | 'authority_delegate'
  | 'collection_delegate'
  | 'use_delegate'
  | 'update_delegate'
  | 'persistent_delegate';

export const getDelegateRoleSeed = (role: DelegateRole): DelegateRoleSeed => {
  switch (role) {
    case DelegateRole.Authority:
      return 'authority_delegate';
    case DelegateRole.Collection:
      return 'collection_delegate';
    case DelegateRole.Use:
      return 'use_delegate';
    case DelegateRole.Update:
      return 'update_delegate';
    case DelegateRole.Transfer:
    case DelegateRole.Utility:
    case DelegateRole.Sale:
      return 'persistent_delegate';
    default:
      throw new UnreachableCaseError(role);
  }
};

export const dummyPlayground = (role: DelegateRole): any => {
  switch (role) {
    case DelegateRole.Authority:
      return 'authority_delegate';
    case DelegateRole.Collection:
      return 'collection_delegate';
    case DelegateRole.Use:
      return 'use_delegate';
    case DelegateRole.Update:
      return 'update_delegate';
    case DelegateRole.Transfer:
    case DelegateRole.Utility:
    case DelegateRole.Sale:
      return 'persistent_delegate';
    default:
      throw new UnreachableCaseError(role);
  }
};
