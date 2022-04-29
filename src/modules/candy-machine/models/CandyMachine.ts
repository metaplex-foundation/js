import {
  CandyMachine,
  CandyMachineData,
  EndSettings,
  GatekeeperConfig,
  HiddenSettings,
  WhitelistMintSettings,
} from '@metaplex-foundation/mpl-candy-machine';
import { Creator } from '@metaplex-foundation/mpl-token-metadata';
import BN from 'bn.js';
import { tryConvertToPublickKey, tryConvertToMillisecondsSinceEpoch, Model } from '../../../shared';
import assert from '../../../utils/assert';
import {
  CandyMachineConfigWithoutStorage,
  creatorsConfigDefault,
  endSettingsFromConfig,
  gatekeeperFromConfig,
  hiddenSettingsFromConfig,
  whiteListMintSettingsFromConfig,
} from './config';
import { Connection, PublicKey } from '@solana/web3.js';
import { getSpaceForCandy } from './candyMachineSpace';

export class CandyMachineModel extends Model {
  private constructor(
    readonly price: BN,
    readonly symbol: string,
    readonly sellerFeeBasisPoints: number,

    readonly maxSupply: BN,
    readonly isMutable: boolean,
    readonly retainAuthority: boolean,
    readonly creators: Creator[],
    readonly itemsAvailable: BN,

    // First 6 chars of candy machine instance address (PDA), only available
    // after the candy machine is created
    readonly uuid?: string,
    readonly goLiveDate?: BN,
    readonly endSettings?: EndSettings,
    readonly hiddenSettings?: HiddenSettings,
    readonly whitelistMintSettings?: WhitelistMintSettings,
    readonly gatekeeper?: GatekeeperConfig
  ) {
    super();
  }

  getData(candyMachinePubkey?: PublicKey): CandyMachineData {
    const uuid = this.resolveUuid(candyMachinePubkey);
    return {
      price: this.price,
      symbol: this.symbol,
      sellerFeeBasisPoints: this.sellerFeeBasisPoints,

      maxSupply: this.maxSupply,
      isMutable: this.isMutable,
      retainAuthority: this.retainAuthority,
      creators: this.creators,
      itemsAvailable: this.itemsAvailable,

      uuid,
      goLiveDate: this.goLiveDate ?? null,
      endSettings: this.endSettings ?? null,
      hiddenSettings: this.hiddenSettings ?? null,
      whitelistMintSettings: this.whitelistMintSettings ?? null,
      gatekeeper: this.gatekeeper ?? null,
    };
  }

  private resolveUuid(candyMachinePubkey?: PublicKey) {
    let uuid = this.uuid;
    if (uuid == null && candyMachinePubkey != null) {
      uuid = candyMachineUuidFromPubkey(candyMachinePubkey);
    }
    assert(uuid != null, 'uuid must be set or the pda provided in order to derive it');
    return uuid;
  }

  static fromCandyMachineData(candyMachineData: CandyMachineData) {
    const goLiveDate =
      candyMachineData.goLiveDate != null ? new BN(candyMachineData.goLiveDate) : undefined;
    return new CandyMachineModel(
      new BN(candyMachineData.price),
      candyMachineData.symbol,
      candyMachineData.sellerFeeBasisPoints,
      new BN(candyMachineData.maxSupply),
      candyMachineData.isMutable,
      candyMachineData.retainAuthority,
      candyMachineData.creators,
      new BN(candyMachineData.itemsAvailable),
      candyMachineData.uuid,
      goLiveDate,
      candyMachineData.endSettings ?? undefined,
      candyMachineData.hiddenSettings ?? undefined,
      candyMachineData.whitelistMintSettings ?? undefined,
      candyMachineData.gatekeeper ?? undefined
    );
  }

  static fromConfig(config: CandyMachineConfigWithoutStorage) {
    const configCreators = config.creators ?? creatorsConfigDefault(config.solTreasuryAccount);
    const creators: Creator[] = configCreators.map((creatorConfig) => ({
      ...creatorConfig,
      address: tryConvertToPublickKey(creatorConfig.address),
    }));

    const goLiveDate = tryConvertToMillisecondsSinceEpoch(config.goLiveDate);

    const hiddenSettings = hiddenSettingsFromConfig(config.hiddenSettings);
    const endSettings = endSettingsFromConfig(config.endSettings);
    const whitelistMintSettings = whiteListMintSettingsFromConfig(config.whitelistMintSettings);
    const gatekeeper = gatekeeperFromConfig(config.gatekeeper);

    return new CandyMachineModel(
      new BN(config.price),
      config.symbol ?? '',
      config.sellerFeeBasisPoints,

      new BN(config.number),
      config.isMutable,
      config.retainAuthority,
      creators,
      new BN(config.number),

      // uuid is not known until the candy machine is created
      undefined,

      goLiveDate,
      endSettings,
      hiddenSettings,
      whitelistMintSettings,
      gatekeeper
    );
  }

  getSize(candyMachinePubkey?: PublicKey) {
    return getSpaceForCandy(this.getData(candyMachinePubkey));
  }

  static async findCandyMachine(candyMachineAddress: PublicKey, connection: Connection) {
    return CandyMachineAccount.fromAccountAddress(connection, candyMachineAddress);
  }
}

// -----------------
// Helpers
// -----------------

export function candyMachineUuidFromPubkey(candyMachinePubkey: PublicKey) {
  // NOTE: repeating program business logic here which isn't ideal
  return candyMachinePubkey.toBase58().slice(0, 6);
}
