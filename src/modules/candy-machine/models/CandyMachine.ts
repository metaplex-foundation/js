import { bignum } from '@metaplex-foundation/beet';
import {
  Creator,
  EndSettings,
  GatekeeperConfig,
  HiddenSettings,
  WhitelistMintSettings,
} from '@metaplex-foundation/mpl-candy-machine';
import { PublicKey } from '@solana/web3.js';
import { CandyMachineAccount } from '../../../programs/candyMachine';
import { Model } from '../../../shared';

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

  private constructor(readonly candyMachineAccount: CandyMachineAccount) {
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
    this.whitelistMintSettings = accountData.data.whitelistMintSettings ?? undefined;
    this.gatekeeper = accountData.data.gatekeeper ?? undefined;

    this.creators = accountData.data.creators;

    // CandyMachine Data
    this.itemsRedeemed = accountData.itemsRedeemed;

    // CandyMachine Addresses
    this.authorityAddress = accountData.authority;
    this.walletAddress = accountData.wallet;
    this.tokenMintAddress = accountData.tokenMint ?? undefined;
  }

  static fromAccount(candyMachineAccount: CandyMachineAccount): CandyMachine {
    return new CandyMachine(candyMachineAccount);
  }
}
