import { Metaplex } from '../../../Metaplex.js';
import { Loader } from '../../../shared/index.js';
import { removeEmptyChars } from '../../../utils/index.js';
import { JsonMetadata } from './JsonMetadata.js';
import { Nft } from './Nft.js';

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
