import {
  Creator,
  EndSettings,
  EndSettingType,
  GatekeeperConfig,
  HiddenSettings,
  WhitelistMintMode,
} from '@metaplex-foundation/mpl-candy-machine';
import {
  DateTimeString,
  lamports,
  PublicKeyString,
  sol,
  toBigNumber,
  toOptionDateTime,
  toPublicKey,
} from '@/types';
import { CandyMachineConfigs } from './CandyMachineConfigs';
import { WhitelistMintSettings } from './CandyMachine';
import { UnreachableCaseError } from '@/errors';

/**
 * Configuration for the Candy Machine.
 * For more info {@see https://docs.metaplex.com/candy-machine-v2/configuration}
 *
 * @property price - The amount in SOL or SPL token for a mint.
 * @property number - The number of items in the Candy Machine
 * @property sellerFeeBasisPoints - Royalty basis points that goes to creators
 * in secondary sales (0-10000)
 * @property solTreasuryAccount - Wallet to receive proceedings SOL payments
 * @property goLiveDate - Timestamp when minting is allowed – the Candy Machine
 * authority and whitelists can bypass this constraint
 * @property retainAuthority - Indicates whether the candy machine authority
 * has the update authority for each mint or if it is transferred to the
 * minter. This should be set to `true` for the vast majority of cases.
 * @property isMutable - Indicates whether the NFTs' metadata is mutable or not
 * after having been minted
 * @property symbol - Optional Symbol for the NFts of the Candy Machine which
 * can be up to 10 bytes
 * @property splTokenAccount - SPL token wallet to receive proceedings from SPL token payments
 * @property splToken - Mint address of the token accepted as payment
 * @property gatekeeper - {@link GatekeeperSettingsConfig}
 * @property endSettings - {@link EndSettingsConfig}
 * @property whitelistMintSettings - {@link WhitelistMintSettingsConfig}
 * @property hiddenSettings - {@link HiddenSettingsConfig}
 *
 * ## Minimum Config Example
 *
 * ```json
 * {
 *    "price": 1.0,
 *    "number": 10,
 *    "gatekeeper": null,
 *    "solTreasuryAccount": "<YOUR WALLET ADDRESS>",
 *    "splTokenAccount": null,
 *    "splToken": null,
 *    "goLiveDate": "25 Dec 2021 00:00:00 GMT",
 *    "endSettings": null,
 *    "whitelistMintSettings": null,
 *    "hiddenSettings": null,
 *    "storage": "arweave-sol",
 *    "ipfsInfuraProjectId": null,
 *    "ipfsInfuraSecret": null,
 *    "nftStorageKey": null,
 *    "awsS3Bucket": null,
 *    "noRetainAuthority": false,
 *    "noMutable": false,
 * }
 * ```
 */
export type CandyMachineJsonConfigs = {
  price: number;
  number: number;
  sellerFeeBasisPoints: number;
  solTreasuryAccount: PublicKeyString;
  goLiveDate: DateTimeString;
  noRetainAuthority: boolean;
  noMutable: boolean;
  creators?: CreatorsConfig;
  symbol?: string;
  splTokenAccount?: PublicKeyString;
  splToken?: PublicKeyString;
  gatekeeper?: GatekeeperSettingsConfig;
  endSettings?: EndSettingsConfig;
  whitelistMintSettings?: WhitelistMintSettingsConfig;
  hiddenSettings?: HiddenSettingsConfig;
};

/**
 * While the unpredictable mint index provides some protection against bots,
 * they are still able to mint directly from the Candy Machine. If you want to
 * make sure that only humans can mint from your project, gatekeeper settings
 * can be enabled.
 *
 * @property gatekeeperNetwork - Gateway provider address
 * @property expireOnUse - Requires a new gateway challenge after a use
 */
type GatekeeperSettingsConfig = {
  gatekeeperNetwork: PublicKeyString;
  expireOnUse: boolean;
};

/**
 * Hidden settings serve two purposes. First, it allows the creation of larger
 * drops (20k+), since the metadata is not stored on-chain. In turn, this also
 * allows the creation of hide-and-reveal drops, where users discover which
 * item(s) they minted after the mint is complete.
 *
 * Once hidden settings are enabled, every mint will have the same URI and the
 * name will be created by appending the mint number (e.g., “#45”) to the name
 * specified. The hash is expected to be a 32 character string corresponding to
 * the hash of a cache file that has the mapping between a mint number and the
 * actual metadata URI. This allows the order of the mint to be verified by
 * others after the mint is complete.
 *
 * Since the metadata is not on-chain, it is possible to create very large
 * drops. The only caveat is that there is a need for an off-chain process to
 * update the metadata for each item. This is important otherwise all items
 * will have the same metadata.
 *
 * @property name - Name of the mint. The number of the mint will be appended to the name.
 * @property uri - Single URI for all mints.
 * @property hash - 32 character hash. In most cases this is the hash of the cache file with
 * the mapping between mint number and metadata so that the order can be verified when the mint
 * is complete
 */
type HiddenSettingsConfig = {
  name: string;
  uri: string;
  hash: string;
};

/**
 * End Settings provides a mechanism to stop the mint if a certain condition is
 * met without interaction.
 *
 * @property endSettingType - {@link EndSettingMode} (date or amount) which identifies
 * what {@link EndSettingsConfig.value} means
 * @property value - to test the end condition. This will be either a date
 * string (end DateTime) or an integer amount (items minted)
 * */

type EndSettingsConfig =
  | {
      endSettingType: 'date';
      value: string;
    }
  | {
      endSettingType: 'amount';
      value: number;
    };

const BURN_EVERY_TIME = 'burnEveryTime';
const NEVER_BURN = 'neverBurn';
const WhitelistModes = [BURN_EVERY_TIME, NEVER_BURN] as const;

/**
 * Whitelist Modes
 *
 * burnEveryTime - Whitelist token is burned after the mint
 * neverBurn - Whitelist token is returned to holder
 */
type WhitelistMode = typeof WhitelistModes[number];

/**
 * Whitelist Mint Settings

 * Whitelist settings provide a variety of different use cases and revolve
 * around the idea of using custom SPL tokens to offer special rights to token
 * holders - how said SPL token is distributed is up to you. 
 *
 * @property mode - {@link WhitelistMode} (burnEveryTime or neverBurn)
 * @property mint - Mint address of the whitelist token
 * @property presale - Indicates whether whitelist token holders can mint before goLiveDate
 * @property discountPrice - Price for whitelist token holders
 */
type WhitelistMintSettingsConfig = {
  mode: WhitelistMode;
  mint: PublicKeyString;
  presale: boolean;
  discountPrice: number;
};

type CreatorConfig = Omit<Creator, 'address'> & {
  address: PublicKeyString;
};
type CreatorsConfig = CreatorConfig[];

export const getCandyMachineConfigsFromJson = (
  config: CandyMachineJsonConfigs
): CandyMachineConfigs => {
  const configCreators = config.creators ?? [
    {
      address: config.solTreasuryAccount,
      verified: false,
      share: 100,
    },
  ];

  const creators: Creator[] = configCreators.map((creatorConfig) => ({
    ...creatorConfig,
    address: toPublicKey(creatorConfig.address),
  }));

  return {
    price: sol(config.price),
    symbol: config.symbol ?? '',
    sellerFeeBasisPoints: config.sellerFeeBasisPoints,
    maxEditionSupply: toBigNumber(config.number),
    isMutable: !config.noMutable,
    retainAuthority: !config.noRetainAuthority,
    goLiveDate: toOptionDateTime(config.goLiveDate),
    itemsAvailable: toBigNumber(config.number),
    endSettings: endSettingsFromConfig(config.endSettings),
    hiddenSettings: hiddenSettingsFromConfig(config.hiddenSettings),
    whitelistMintSettings: whiteListMintSettingsFromConfig(
      config.whitelistMintSettings
    ),
    gatekeeper: gatekeeperFromConfig(config.gatekeeper),
    creators,
  };
};

const endSettingsFromConfig = (
  config?: EndSettingsConfig
): EndSettings | undefined => {
  if (config == null) return undefined;

  return {
    endSettingType:
      config.endSettingType === 'date'
        ? EndSettingType.Date
        : EndSettingType.Amount,
    number: toBigNumber(config.value),
  };
};

const hiddenSettingsFromConfig = (
  config?: HiddenSettingsConfig
): HiddenSettings | undefined => {
  if (config == null) return undefined;
  const hash = Buffer.from(config.hash, 'utf8').toJSON().data;
  return { ...config, hash };
};

const whiteListMintSettingsFromConfig = (
  config?: WhitelistMintSettingsConfig
): WhitelistMintSettings | undefined => {
  if (config == null) return undefined;
  let mode: WhitelistMintMode;
  switch (config.mode) {
    case BURN_EVERY_TIME:
      mode = WhitelistMintMode.BurnEveryTime;
      break;
    case NEVER_BURN:
      mode = WhitelistMintMode.NeverBurn;
      break;
    default:
      throw new UnreachableCaseError(config.mode);
  }

  return {
    ...config,
    mode,
    mint: toPublicKey(config.mint),
    discountPrice: lamports(config.discountPrice),
  };
};

const gatekeeperFromConfig = (
  config?: GatekeeperSettingsConfig
): GatekeeperConfig | undefined => {
  if (config == null) return undefined;

  return {
    ...config,
    gatekeeperNetwork: toPublicKey(config.gatekeeperNetwork),
  };
};
