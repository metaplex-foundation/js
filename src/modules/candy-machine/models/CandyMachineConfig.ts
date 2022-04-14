import BigNumber from 'bignumber.js';
import { PublicKeyString } from '../../../shared/PublicKeyString';

// -----------------
// Gatekeeper Settings
// -----------------

/**
 * Configures {@link CandyMachineConfig.gatekeeper} settings.
 *
 * @property gateKeeperNetwork - Gateway provider address
 * @property expireOnUse - Requires a new gateway challenge after a use
 */
export type GatekeeperSettingsConfig = {
  gateKeeperNetwork: string;
  expireOnUse: boolean;
};

// -----------------
// Whitelist Mint Settings
// -----------------
export const BURN_EVERY_TIME = 'burnEveryTime';
export const NEVER_BURN = 'neverBurn';

export const WhitelistModes = [BURN_EVERY_TIME, NEVER_BURN] as const;

/**
 * Whitelist Modes
 *
 * burnEveryTime - Whitelist token is burned after the mint
 * neverBurn - Whitelist token is returned to holder
 */
export type WhitelistMode = typeof WhitelistModes[number];

/**
 * Whitelist Mint Settings
 *
 * @property mode - {@link WhitelistMode} (burnEveryTime or neverBurn)
 * @property mint - Mint address of the whitelist token
 * @property presale - Indicates whether whitelist token holders can mint before goLiveDate
 * @property discountPrice - Price for whitelist token holders
 */
export type WhitelistMintSettingsConfig = {
  mode: WhitelistMode;
  mint: PublicKeyString;
  presale: boolean;
  discountPrice: BigNumber;
};

// -----------------
// Hidden Settings
// -----------------

/**
 * Configures {@link CandyMachineConfig.hiddenSettings}
 *
 * @property name - Name of the mint. The number of the mint will be appended to the name.
 * @property uri - Single URI for all mints.
 * @property hash - 32 character hash. In most cases this is the hash of the cache file with
 * the mapping between mint number and metadata so that the order can be verified when the mint
 * is complete
 */
export type HiddenSettingsConfig = {
  name: string;
  uri: string;
  hash: string;
};

// -----------------
// Storage
// -----------------

/**
 * Uploads to arweave using Bundlr and payments are made in SOL (Recommended
 * option. Works on mainnet and devnet. Files are only stored for 7 days on
 * devnet.)
 */
export const ARWEAVE_SOL = 'arweave-sol';

/**
 * Uploads to arweave and payments are made in AR (only works in mainnet and
 * requires an Arweave wallet)
 */
export const ARWEAVE_BUNDLE = 'arweave-bundle';

/** Uploads to IPFS (must specify either Infura Project ID or Secret Key) */
export const IPFS = 'ipfs';

/** Uploads to NFT.Storage (no payment required, works on all networks) */
export const NFT_STORAGE = 'nft-storage';

/** Uploads to AWS (must specify AWS Bucket name) */
export const AWS = 'aws';

/** Arweave specific storages */
const ArweaveStorages = [ARWEAVE_SOL, ARWEAVE_BUNDLE] as const;

/** The existing storage options */
export const CandyMachineStorages = [...ArweaveStorages, IPFS, NFT_STORAGE, AWS] as const;

/** Available storage options */
export type CandyMachineStorage = typeof CandyMachineStorages[number];

type BaseStorageConfig = {
  awsS3Bucket?: string;
  infuraProjectId?: string;
  ipfsSecretKey?: string;
  nftStorageKey?: string;
};

/**
 * Arweave specific Storage Options with required extra props
 * @property arweaveJwk - Arweave JWK (JSON Web Key) wallet file
 */
type ArweaveStorageConfig = BaseStorageConfig & {
  storage: typeof ArweaveStorages[number];
  arweaveJwk: string;
};

/**
 * IPFS specific Storage Options with required extra props
 * @property ipfsInfuraProjectId - Infura Project ID for IPFS
 * @property ipfsInfuraSecret - Infura Project Secret for IPFS
 */
type IpfsStorageConfig = BaseStorageConfig & {
  storage: typeof IPFS;
  infuraProjectId: string;
  ipfsSecretKey: string;
};

/**
 * NftStorage specific Storage Options with required extra props
 * @property nftStorageKey - NFT.Storage API Key
 */
type NftStorageConfig = BaseStorageConfig & {
  storage: typeof NFT_STORAGE;
  nftStorageKey: string;
};

/**
 * AWS specific Storage Options with required extra props
 * @property awsS3Bucket - AWS Bucket name
 */
type AwsStorageConfig = BaseStorageConfig & {
  storage: typeof AWS;
  awsS3Bucket: string;
};

/**
 * Candy Machine Storage Options.
 * Specific config properties are only needed/available for the respective
 * storage provider.
 */
export type StorageConfig =
  | ArweaveStorageConfig
  | IpfsStorageConfig
  | NftStorageConfig
  | AwsStorageConfig;

// -----------------
// End Settings
// -----------------
export const ENDSETTING_DATE = 'date';
export const ENDSETTING_AMOUNT = 'amount';
export const EndSettingModes = [ENDSETTING_DATE, ENDSETTING_AMOUNT] as const;
export type EndSettingMode = typeof EndSettingModes[number];
/**
 * Configures {@link CandyMachineConfig.endSettings}
 *
 * @property mode - {@link EndSettingMode} (date or amount) which identifies
 * what {@link EndSettingsConfig.value} means
 * @property value - to test the end condition. This will be either a date
 * string (end DateTime) or an integer amount (items minted)
 * */
export type EndSettingsConfig =
  | {
      mode: typeof ENDSETTING_DATE;
      value: string;
    }
  | {
      mode: typeof ENDSETTING_AMOUNT;
      value: number;
    };

/**
 * Configuration for the Candy Machine.
 * For more info {@see https://docs.metaplex.com/candy-machine-v2/configuration}
 *
 * @property price - The amount in SOL or SPL token for a mint.
 * @property number - The number of items in the Candy Machine
 * @property solTreasuryAccount - Wallet to receive proceedings SOL payments
 *
 * @property goLiveDate - Timestamp when minting is allowed – the Candy Machine
 * authority and whitelists can bypass this constraint
 *
 * @property retainAuthority - Indicates whether the candy machine authority
 * has the update authority for each mint or if it is transferred to the
 * minter. This should be set to `true` for the vast majority of cases.
 *
 * @property isMutable - Indicates whether the NFTs' metadata is mutable or not
 * after having been minted
 *
 * @property splTokenAccount - SPL token wallet to receive proceedings from SPL token payments
 * @property splToken - Mint address of the token accepted as payment
 *
 * @property gateKeeper - {@link GatekeeperSettingsConfig}
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
 *    "retainAuthority": true, // no longer double negation
 *    "isMutable": false        // no longer double negation
 * }
 * ```
 */
export type CandyMachineConfig = {
  price: number;
  number: number;
  solTreasuryAccount: PublicKeyString;
  goLiveDate: string;
  retainAuthority: boolean;
  isMutable: boolean;
  splTokenAccount?: PublicKeyString;
  splToken?: PublicKeyString;
  gatekeeper?: GatekeeperSettingsConfig;
  endSettings: EndSettingsConfig;
  whitelistMintSettings: WhitelistMintSettingsConfig;
  hiddenSettings: HiddenSettingsConfig;
} & StorageConfig;
