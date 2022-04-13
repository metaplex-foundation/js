import { Metaplex } from '@/Metaplex';
import { Loader } from '@/shared/index';
import { removeEmptyChars } from '@/utils/index';
import { JsonMetadata } from './JsonMetadata';
import { Nft } from './Nft';

export class JsonMetadataLoader extends Loader<JsonMetadata> {
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
