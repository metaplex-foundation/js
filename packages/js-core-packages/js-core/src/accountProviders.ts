// TODO(thlorenz): the mpl modules should export those as 'accountProviders'
import {
  CandyMachine,
  CollectionPDA,
} from '@metaplex-foundation/mpl-candy-machine';
import {
  CollectionAuthorityRecord,
  Edition,
  EditionMarker,
  MasterEditionV2,
  Metadata,
  ReservationListV2,
  UseAuthorityRecord,
} from '@metaplex-foundation/mpl-token-metadata';

/** @internal */
export const accountProviders = {
  CandyMachine,
  CollectionPDA,
  CollectionAuthorityRecord,
  Edition,
  EditionMarker,
  MasterEditionV2,
  Metadata,
  ReservationListV2,
  UseAuthorityRecord,
};
