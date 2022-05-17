import { PublicKeyString } from '@/types';
import { CreatorsConfig } from './Creators';
import { EndSettingsConfig } from './EndSettings';
import { GatekeeperSettingsConfig } from './Gatekeeper';
import { HiddenSettingsConfig } from './HiddenSettings';
import { StorageConfig } from './Storage';
import { WhitelistMintSettingsConfig } from './WhitelistMint';

/**
 * Configuration for the Candy Machine.
 * For more info {@see https://docs.metaplex.com/candy-machine-v2/configuration}
 *
 * @property price - The amount in SOL or SPL token for a mint.
 * @property number - The number of items in the Candy Machine
 * @property sellerFeeBasisPoints - Royalty basis points that goes to creators
 * in secondary sales (0-10000)
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
 * @property symbol - Optional Symbol for the NFts of the Candy Machine which
 * can be up to 10 bytes
 *
 * @property splTokenAccount - SPL token wallet to receive proceedings from SPL token payments
 * @property splToken - Mint address of the token accepted as payment
 *
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
 *    "retainAuthority": true, // no longer double negation
 *    "isMutable": false        // no longer double negation
 * }
 * ```
 */
export type CandyMachineConfig = {
  price: number;
  number: number;
  sellerFeeBasisPoints: number;
  solTreasuryAccount: PublicKeyString;
  goLiveDate: string;
  retainAuthority: boolean;
  isMutable: boolean;
  creators?: CreatorsConfig;
  symbol?: string;
  splTokenAccount?: PublicKeyString;
  splToken?: PublicKeyString;
  gatekeeper?: GatekeeperSettingsConfig;
  endSettings?: EndSettingsConfig;
  whitelistMintSettings?: WhitelistMintSettingsConfig;
  hiddenSettings?: HiddenSettingsConfig;
} & StorageConfig;

export type CandyMachineConfigWithoutStorage = Omit<
  CandyMachineConfig,
  keyof StorageConfig
>;
