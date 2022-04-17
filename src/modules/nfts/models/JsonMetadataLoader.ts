import { Metaplex } from '@/Metaplex';
import { OldLoader } from '@/shared';
import { removeEmptyChars } from '@/utils';
import { JsonMetadata } from './JsonMetadata';
import { Nft } from './Nft';

export class JsonMetadataLoader extends OldLoader<JsonMetadata> {
  protected nft: Nft;

  constructor(nft: Nft) {
    super();
    this.nft = nft;
  }

  public async handle(metaplex: Metaplex) {
    const uri = removeEmptyChars(this.nft.metadataAccount.data.data.uri);

    return metaplex.storage().downloadJson<JsonMetadata>(uri);
  }
}
