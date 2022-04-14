import { Model, parseBigNumber, SolAmount } from '@/shared';
import {
  CandyMachineData,
  EndSettings,
  GatekeeperConfig,
  HiddenSettings,
  WhitelistMintSettings,
} from '@metaplex-foundation/mpl-candy-machine';
import { Creator } from '@metaplex-foundation/mpl-token-metadata';
import BigNumber from 'bignumber.js';

export class CandyMachine extends Model {
  private constructor(
    readonly uuid: string,
    readonly price: SolAmount,
    readonly symbol: string,
    readonly sellerFeeBasisPoints: number,
    readonly maxSupply: BigNumber,
    readonly isMutable: boolean,
    readonly retainAuthority: boolean,
    readonly creators: Creator[],
    readonly itemsAvailable: BigNumber,
    readonly goLiveDate?: BigNumber,
    readonly endSettings?: EndSettings,
    readonly hiddenSettings?: HiddenSettings,
    readonly whitelistMintSettings?: WhitelistMintSettings,
    readonly gatekeeper?: GatekeeperConfig
  ) {
    super();
  }

  static fromCandyMachineData(candyMachineData: CandyMachineData) {
    const goLiveDate =
      candyMachineData.goLiveDate != null ? parseBigNumber(candyMachineData.goLiveDate) : undefined;
    return new CandyMachine(
      candyMachineData.uuid,
      SolAmount.fromLamports(candyMachineData.price),
      candyMachineData.symbol,
      candyMachineData.sellerFeeBasisPoints,
      parseBigNumber(candyMachineData.maxSupply),
      candyMachineData.isMutable,
      candyMachineData.retainAuthority,
      candyMachineData.creators,
      parseBigNumber(candyMachineData.itemsAvailable),
      goLiveDate,
      candyMachineData.endSettings ?? undefined,
      candyMachineData.hiddenSettings ?? undefined,
      candyMachineData.whitelistMintSettings ?? undefined,
      candyMachineData.gatekeeper ?? undefined
    );
  }

  static fromMinimalConfig(config: CandyMachineConfig) {}
}
