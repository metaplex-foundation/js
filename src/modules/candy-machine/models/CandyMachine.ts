import {
  CandyMachineData,
  EndSettings,
  GatekeeperConfig,
  HiddenSettings,
  WhitelistMintSettings,
} from '@metaplex-foundation/mpl-candy-machine';
import { Creator } from '@metaplex-foundation/mpl-token-metadata';
import BN from 'bn.js';
import {
  tryConvertToPublickKey,
  tryConvertToMillisecondsSinceEpoch,
  Model,
  SolAmount,
} from '../../../shared';
import {
  CandyMachineConfig,
  endSettingsFromConfig,
  gatekeeperFromConfig,
  hiddenSettingsFromConfig,
  StorageConfig,
  whiteListMintSettingsFromConfig,
} from './config';

export class CandyMachine extends Model {
  private constructor(
    readonly price: SolAmount,
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

  static fromCandyMachineData(candyMachineData: CandyMachineData) {
    const goLiveDate =
      candyMachineData.goLiveDate != null ? new BN(candyMachineData.goLiveDate) : undefined;
    return new CandyMachine(
      SolAmount.fromLamports(candyMachineData.price),
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

  static fromConfig(config: Omit<CandyMachineConfig, keyof StorageConfig>) {
    const price = SolAmount.fromSol(config.price);
    const creators: Creator[] = config.creators.map((creatorConfig) => ({
      ...creatorConfig,
      address: tryConvertToPublickKey(creatorConfig.address),
    }));

    const goLiveDate = tryConvertToMillisecondsSinceEpoch(config.goLiveDate);

    const hiddenSettings = hiddenSettingsFromConfig(config.hiddenSettings);
    const endSettings = endSettingsFromConfig(config.endSettings);
    const whitelistMintSettings = whiteListMintSettingsFromConfig(config.whitelistMintSettings);
    const gatekeeper = gatekeeperFromConfig(config.gatekeeper);

    return new CandyMachine(
      price,
      config.symbol ?? '',
      config.sellerFeeBasisPoints,

      new BN(config.number),
      config.isMutable,
      config.retainAuthority,
      creators,
      new BN(config.number),

      undefined, // uuid is not known until the candy machine is created
      goLiveDate,
      endSettings,
      hiddenSettings,
      whitelistMintSettings,
      gatekeeper
    );
  }
}
