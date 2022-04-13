import { Amman } from '@metaplex-foundation/amman';
import { PROGRAM_ADDRESS as TOKEN_METADATA_ADDRESS } from '@metaplex-foundation/mpl-token-metadata';

export const amman = Amman.instance({
  knownLabels: { [TOKEN_METADATA_ADDRESS]: 'Token Metadata' },
});
