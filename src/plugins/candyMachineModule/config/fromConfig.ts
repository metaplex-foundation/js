import {
  CandyMachine,
  CandyMachineArgs,
  CandyMachineData,
  Creator,
} from '@metaplex-foundation/mpl-candy-machine';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { convertToMillisecondsSinceEpoch, convertToPublickKey } from '@/types';
import { CandyMachineConfigWithoutStorage } from './CandyMachineConfig';
import { creatorsConfigDefault } from './Creators';
import { endSettingsFromConfig } from './EndSettings';
import { gatekeeperFromConfig } from './Gatekeeper';
import { hiddenSettingsFromConfig } from './HiddenSettings';
import { whiteListMintSettingsFromConfig } from './WhitelistMint';

export type CandyMachineAddresses = {
  candyMachineAddress: PublicKey;
  authorityAddress: PublicKey;
  walletAddress: PublicKey;
  tokenMintAddress?: PublicKey;
};

export function candyMachineDataFromConfig(
  config: CandyMachineConfigWithoutStorage,
  candyMachineAddress: PublicKey
): CandyMachineData {
  const configCreators =
    config.creators ?? creatorsConfigDefault(config.solTreasuryAccount);
  const creators: Creator[] = configCreators.map((creatorConfig) => ({
    ...creatorConfig,
    address: convertToPublickKey(creatorConfig.address),
  }));

  const goLiveDate = convertToMillisecondsSinceEpoch(config.goLiveDate);

  const hiddenSettings =
    hiddenSettingsFromConfig(config.hiddenSettings) ?? null;
  const endSettings = endSettingsFromConfig(config.endSettings) ?? null;
  const whitelistMintSettings =
    whiteListMintSettingsFromConfig(config.whitelistMintSettings) ?? null;
  const gatekeeper = gatekeeperFromConfig(config.gatekeeper) ?? null;

  return {
    uuid: candyMachineUuidFromAddress(candyMachineAddress),

    price: new BN(config.price),
    symbol: config.symbol ?? '',
    sellerFeeBasisPoints: config.sellerFeeBasisPoints,

    maxSupply: new BN(config.number),
    isMutable: config.isMutable,
    retainAuthority: config.retainAuthority,
    goLiveDate,
    itemsAvailable: new BN(config.number),

    endSettings,
    hiddenSettings,
    whitelistMintSettings,
    gatekeeper,

    creators,
  };
}
export function candyMachineAccountDataFromConfig(
  config: CandyMachineConfigWithoutStorage,
  addresses: CandyMachineAddresses
) {
  const data = candyMachineDataFromConfig(
    config,
    addresses.candyMachineAddress
  );
  const args: CandyMachineArgs = {
    authority: addresses.authorityAddress,
    wallet: addresses.walletAddress,
    tokenMint: addresses.tokenMintAddress ?? null,
    itemsRedeemed: new BN(0),
    data,
  };

  return CandyMachine.fromArgs(args);
}

function candyMachineUuidFromAddress(candyMachineAddress: PublicKey) {
  // NOTE: repeating program business logic here which isn't ideal
  return candyMachineAddress.toBase58().slice(0, 6);
}
