import { PublicKey } from '@solana/web3.js';
import { TokenStandard, Collection, Uses, Creator } from '@metaplex-foundation/mpl-token-metadata';
import { Model } from '@/shared';
import { MetadataAccount } from '@/programs/tokenMetadata';
import { JsonMetadataLoader } from './JsonMetadataLoader';
import { removeEmptyChars } from '@/utils';
import { MasterEditionLoader } from './MasterEditionLoader';

export class Nft extends Model {
  /** The Metadata PDA account defining the NFT. */
  public readonly metadataAccount: MetadataAccount;

  /** Loaders. */
  public readonly metadata: JsonMetadataLoader;
  public readonly masterEdition: MasterEditionLoader;

  /** Data from the Metadata account. */
  public readonly updateAuthority: PublicKey;
  public readonly mint: PublicKey;
  public readonly name: string;
  public readonly symbol: string;
  public readonly uri: string;
  public readonly sellerFeeBasisPoints: number;
  public readonly creators: Creator[] | null;
  public readonly primarySaleHappened: boolean;
  public readonly isMutable: boolean;
  public readonly editionNonce: number | null;
  public readonly tokenStandard: TokenStandard | null;
  public readonly collection: Collection | null;
  public readonly uses: Uses | null;

  constructor(metadataAccount: MetadataAccount) {
    super();
    this.metadataAccount = metadataAccount;
    this.metadata = new JsonMetadataLoader(this);
    this.masterEdition = new MasterEditionLoader(this);

    this.updateAuthority = metadataAccount.data.updateAuthority;
    this.mint = metadataAccount.data.mint;
    this.name = removeEmptyChars(metadataAccount.data.data.name);
    this.symbol = removeEmptyChars(metadataAccount.data.data.symbol);
    this.uri = removeEmptyChars(metadataAccount.data.data.uri);
    this.sellerFeeBasisPoints = metadataAccount.data.data.sellerFeeBasisPoints;
    this.creators = metadataAccount.data.data.creators;
    this.primarySaleHappened = metadataAccount.data.primarySaleHappened;
    this.isMutable = metadataAccount.data.isMutable;
    this.editionNonce = metadataAccount.data.editionNonce;
    this.tokenStandard = metadataAccount.data.tokenStandard;
    this.collection = metadataAccount.data.collection;
    this.uses = metadataAccount.data.uses;
  }
}
