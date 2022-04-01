import { PublicKey } from '@solana/web3.js';
import { Model } from '@/modules/shared';
import { MetadataAccount, MasterEditionAccount } from '@/programs/tokenMetadata';
import { TokenStandard, Collection, Uses, Creator } from '@metaplex-foundation/mpl-token-metadata';
import { bignum } from '@metaplex-foundation/beet';
import { JsonMetadata } from './JsonMetadata';
import { removeEmptyChars } from '@/utils';

export class Nft extends Model {
  /** The Metadata PDA account defining the NFT. */
  public readonly metadataAccount: MetadataAccount;

  /** The optional Metadata Edition PDA account associated with the NFT. */
  public readonly masterEditionAccount: MasterEditionAccount | null;

  /** The JSON metadata from the URI. */
  public readonly metadata: JsonMetadata | null;

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

  /** Data from the MasterEdition account. */
  public readonly supply: bignum | null;
  public readonly maxSupply: bignum | null;

  constructor(
    metadataAccount: MetadataAccount,
    masterEditionAccount: MasterEditionAccount | null = null,
    metadata: JsonMetadata | null = null
  ) {
    super();
    this.metadataAccount = metadataAccount;
    this.masterEditionAccount = masterEditionAccount;
    this.metadata = metadata;

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

    this.supply = masterEditionAccount?.data.supply ?? null;
    this.maxSupply = masterEditionAccount?.data.maxSupply ?? null;
  }
}
