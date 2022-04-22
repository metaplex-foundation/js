import { PublicKey } from '@solana/web3.js';
import {
  TokenStandard,
  Collection,
  Uses,
  Creator,
  MasterEditionV2Args,
} from '@metaplex-foundation/mpl-token-metadata';
import { Metaplex } from '@/Metaplex';
import { Model } from '@/shared';
import { removeEmptyChars } from '@/utils';
import { MetadataAccount, OriginalEditionAccount } from '@/programs/tokenMetadata';
import { JsonMetadata } from './JsonMetadata';
import { useJsonMetadataTask, JsonMetadataTask } from './useJsonMetadataTask';
import { useMasterEditionTask, MasterEditionTask } from './useMasterEditionTask';

export class Nft extends Model {
  /** The Metadata PDA account defining the NFT. */
  public readonly metadataAccount: MetadataAccount;

  /** Tasks. */
  public readonly metadataTask: JsonMetadataTask;
  public readonly masterEditionTask: MasterEditionTask;

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

  constructor(metadataAccount: MetadataAccount, metaplex: Metaplex) {
    super();
    this.metadataAccount = metadataAccount;
    this.metadataTask = useJsonMetadataTask(metaplex, this);
    this.masterEditionTask = useMasterEditionTask(metaplex, this);

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
    return this.metadataTask.getResult() ?? {};
  }

  get masterEditionAccount(): OriginalEditionAccount | null {
    return this.masterEditionTask.getResult() ?? null;
  }

  get masterEdition(): Partial<Omit<MasterEditionV2Args, 'key'>> {
    return this.masterEditionAccount?.data ?? {};
  }

  public is(other: Nft | PublicKey): boolean {
    const mint = other instanceof Nft ? other.mint : other;

    return this.mint.equals(mint);
  }
}
