import { PublicKey } from '@solana/web3.js';
import {
  TokenStandard,
  Collection,
  Uses,
  Creator,
  MasterEditionV2Args,
  EditionArgs,
} from '@metaplex-foundation/mpl-token-metadata';
import { Metaplex } from '@/Metaplex';
import {
  isOriginalEditionAccount,
  isPrintEditionAccount,
  MetadataAccount,
  OriginalEditionAccount,
  OriginalOrPrintEditionAccount,
  PrintEditionAccount,
} from '@/programs';
import { Model } from '@/types';
import { removeEmptyChars } from '@/utils';
import { JsonMetadata } from './JsonMetadata';
import { useJsonMetadataTask, JsonMetadataTask } from './useJsonMetadataTask';
import { useEditionTask, EditionTask } from './useEditionTask';

export class Nft extends Model {
  /** The Metadata PDA account defining the NFT. */
  public readonly metadataAccount: MetadataAccount;

  /** Tasks. */
  public readonly metadataTask: JsonMetadataTask;
  public readonly editionTask: EditionTask;

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
    this.editionTask = useEditionTask(metaplex, this);

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

  get editionAccount(): OriginalOrPrintEditionAccount | null {
    return this.editionTask.getResult() ?? null;
  }

  get originalEdition(): MasterEditionV2Args | null {
    if (!this.isOriginal()) {
      return null;
    }

    return this.editionAccount.data;
  }

  get printEdition(): EditionArgs | null {
    if (!this.isPrint()) {
      return null;
    }

    return this.editionAccount.data;
  }

  public equals(other: Nft | PublicKey): boolean {
    const mint = other instanceof Nft ? other.mint : other;

    return this.mint.equals(mint);
  }

  public isOriginal(): this is { editionAccount: OriginalEditionAccount } {
    return (
      this.editionAccount != null &&
      isOriginalEditionAccount(this.editionAccount)
    );
  }

  public isPrint(): this is { editionAccount: PrintEditionAccount } {
    return (
      this.editionAccount != null && isPrintEditionAccount(this.editionAccount)
    );
  }
}
