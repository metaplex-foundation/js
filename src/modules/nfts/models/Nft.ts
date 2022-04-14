import { PublicKey } from '@solana/web3.js';
import {
  TokenStandard,
  Collection,
  Uses,
  Creator,
  MasterEditionV2Args,
} from '@metaplex-foundation/mpl-token-metadata';
import { Model } from '../../../shared/index.js';
import { MetadataAccount, MasterEditionAccount } from '../../../programs/tokenMetadata/index.js';
import { JsonMetadataLoader } from './JsonMetadataLoader.js';
import { removeEmptyChars } from '../../../utils/index.js';
import { MasterEditionLoader } from './MasterEditionLoader.js';
import { JsonMetadata } from './JsonMetadata.js';

export class Nft extends Model {
  /** The Metadata PDA account defining the NFT. */
  public readonly metadataAccount: MetadataAccount;

  /** Loaders. */
  public readonly metadataLoader: JsonMetadataLoader;
  public readonly masterEditionLoader: MasterEditionLoader;

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
    this.metadataLoader = new JsonMetadataLoader(this);
    this.masterEditionLoader = new MasterEditionLoader(this);

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

  get metadata(): JsonMetadata {
    return this.metadataLoader.getResult() ?? {};
  }

  get masterEditionAccount(): MasterEditionAccount | null {
    return this.masterEditionLoader.getResult() ?? null;
  }

  get masterEdition(): Partial<Omit<MasterEditionV2Args, 'key'>> {
    return this.masterEditionAccount?.data ?? {};
  }

  public is(other: Nft | PublicKey): boolean {
    const mint = other instanceof Nft ? other.mint : other;

    return this.mint.equals(mint);
  }
}
