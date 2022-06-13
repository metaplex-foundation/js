import { PublicKey } from '@solana/web3.js';
import { bignum } from '@metaplex-foundation/beet';
import {
  CandyMachineData,
  ConfigLine,
  Creator,
  EndSettings,
  GatekeeperConfig,
  HiddenSettings,
  WhitelistMintSettings,
} from '@metaplex-foundation/mpl-candy-machine';
import { CandyMachineAccount } from '@/programs';
import { Model } from '@/types';
import {
  getConfigLines,
  getConfigLinesCount,
} from '@/programs/candyMachine/accounts/candyMachineInternals';

export class CandyMachine extends Model {
  // -----------------
  // Data from CandyMachineAccount
  // -----------------
  readonly uuid: string;

  readonly price: bignum;
  readonly symbol: string;
  readonly sellerFeeBasisPoints: number;

  readonly maxSupply: bignum;
  readonly isMutable: boolean;
  readonly retainAuthority: boolean;
  readonly goLiveDate?: bignum;
  readonly itemsAvailable: bignum;

  readonly endSettings?: EndSettings;
  readonly hiddenSettings?: HiddenSettings;
  readonly whitelistMintSettings?: WhitelistMintSettings;
  readonly gatekeeper?: GatekeeperConfig;

  readonly creators: Creator[];

  readonly itemsRedeemed: bignum;

  // -----------------
  // Addresses from CandyMachineAccount
  // -----------------
  readonly authorityAddress: PublicKey;
  readonly walletAddress: PublicKey;
  readonly tokenMintAddress?: PublicKey;

  /**
   * Address at which the Candy Machine is stored on chain.
   */
  readonly candyMachineAddress: PublicKey;

  private constructor(
    readonly candyMachineAccount: CandyMachineAccount,
    readonly rawData: Buffer
  ) {
    super();

    // CandyMachine inner Data
    const accountData = candyMachineAccount.data;
    this.uuid = accountData.data.uuid;
    this.price = accountData.data.price;
    this.symbol = accountData.data.symbol;
    this.sellerFeeBasisPoints = accountData.data.sellerFeeBasisPoints;

    this.maxSupply = accountData.data.maxSupply;
    this.isMutable = accountData.data.isMutable;
    this.retainAuthority = accountData.data.retainAuthority;
    this.goLiveDate = accountData.data.goLiveDate ?? undefined;
    this.itemsAvailable = accountData.data.itemsAvailable;

    this.endSettings = accountData.data.endSettings ?? undefined;
    this.hiddenSettings = accountData.data.hiddenSettings ?? undefined;
    this.whitelistMintSettings =
      accountData.data.whitelistMintSettings ?? undefined;
    this.gatekeeper = accountData.data.gatekeeper ?? undefined;

    this.creators = accountData.data.creators;

    // CandyMachine Data
    this.itemsRedeemed = accountData.itemsRedeemed;

    // CandyMachine Addresses
    this.authorityAddress = accountData.authority;
    this.walletAddress = accountData.wallet;
    this.tokenMintAddress = accountData.tokenMint ?? undefined;
    this.candyMachineAddress = candyMachineAccount.publicKey;
  }

  get assetsCount(): number {
    return getConfigLinesCount(this.rawData);
  }

  get assets(): ConfigLine[] {
    return getConfigLines(this.rawData);
  }

  get isFull(): boolean {
    return this.assetsCount >= this.maxSupply;
  }

  get candyMachineData(): CandyMachineData {
    return {
      uuid: this.uuid,
      price: this.price,
      symbol: this.symbol,
      sellerFeeBasisPoints: this.sellerFeeBasisPoints,
      maxSupply: this.maxSupply,
      isMutable: this.isMutable,
      retainAuthority: this.retainAuthority,
      goLiveDate: this.goLiveDate ?? null,
      itemsAvailable: this.itemsAvailable,
      endSettings: this.endSettings ?? null,
      hiddenSettings: this.hiddenSettings ?? null,
      whitelistMintSettings: this.whitelistMintSettings ?? null,
      gatekeeper: this.gatekeeper ?? null,
      creators: this.creators,
    };
  }

  updatedCandyMachineData(
    update: Partial<CandyMachineData> & Record<string, any>
  ): CandyMachineData {
    const candyUpdate = Object.entries(update).reduce((acc, [key, value]) => {
      if (this.candyMachineData.hasOwnProperty(key)) {
        acc[key as keyof CandyMachineData] = value;
      }
      return acc;
    }, {} as Partial<CandyMachineData>);
    return { ...this.candyMachineData, ...candyUpdate };
  }

  static fromAccount(
    candyMachineAccount: CandyMachineAccount,
    rawData: Buffer
  ): CandyMachine {
    return new CandyMachine(candyMachineAccount, rawData);
  }
}
