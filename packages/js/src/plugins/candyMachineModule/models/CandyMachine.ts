import { PublicKey } from '@solana/web3.js';
import {
  CandyMachineData,
  EndSettingType,
  WhitelistMintMode,
} from '@metaplex-foundation/mpl-candy-machine';
import {
  Amount,
  BigNumber,
  DateTime,
  lamports,
  toBigNumber,
  toDateTime,
  toOptionDateTime,
  UnparsedAccount,
} from '@/types';
import { assert, Option, removeEmptyChars } from '@/utils';
import {
  countCandyMachineItems,
  getCandyMachineUuidFromAddress,
  parseCandyMachineItems,
} from '../helpers';
import {
  CandyMachineAccount,
  MaybeCandyMachineCollectionAccount,
} from '../accounts';
import { Creator } from '@/types';
import { CandyMachineProgram } from '../program';

// -----------------
// Model
// -----------------

/**
 * This model contains all the relevant information about a Candy Machine.
 * This includes its settings but also all of the items (a.k.a. config lines)
 * loaded inside the Candy Machine along with some statistics about the items.
 *
 * @group Models
 */
export type CandyMachine = {
  /** A model identifier to distinguish models in the SDK. */
  readonly model: 'candyMachine';

  /** The address of the Candy Machine account. */
  readonly address: PublicKey;

  /** The address of program that owns the Candy Machine account. */
  readonly programAddress: PublicKey;

  /** Whether this Candy Machine was created from v1 or v2. */
  readonly version: 1 | 2;

  /** The address of the authority that is allowed to manage this Candy Machine. */
  readonly authorityAddress: PublicKey;

  /**
   * The address of the wallet receiving the payments for minting NFTs.
   * If the Candy Machine accepts payments in SOL, this is the SOL treasury account.
   * Otherwise, this is the token account associated with the treasury Mint.
   */
  readonly walletAddress: PublicKey;

  /**
   * The address of the Mint account of the SPL Token that should be used
   * to accept payments for minting NFTs. When `null`, it means the
   * Candy Machine account accepts payments in SOL.
   */
  readonly tokenMintAddress: Option<PublicKey>;

  /**
   * The mint address of the collection NFT that should be associated with
   * minting NFTs. When `null`, it means NFTs will not be part of a
   * collection when minted.
   */
  readonly collectionMintAddress: Option<PublicKey>;

  /**
   * A 6-character long unique identifier for the Candy Machine.
   * This usually is the first 6 characters of the address.
   * This is more of an internal field used by the program
   * and you typically shouldn't need it.
   */
  readonly uuid: string;

  /**
   * The price of minting an NFT.
   *
   * If the Candy Machine uses no treasury mint (i.e. the `tokenMintAddress`
   * is `null`), this amount will be in SOL. Otherwise, its currency will
   * match the currency of the treasury mint.
   */
  readonly price: Amount;

  /**
   * The symbol to use when minting NFTs (e.g. "MYPROJECT")
   *
   * This can be any string up to 10 bytes and can be made optional
   * by providing an empty string.
   */
  readonly symbol: string;

  /**
   * The royalties that should be set on minted NFTs in basis points
   * (i.e. 250 is 2.5%).
   */
  readonly sellerFeeBasisPoints: number;

  /**
   * Whether the minted NFTs should be mutable or not.
   *
   * We recommend setting this to `true` unless you have a specific reason.
   * You can always make NFTs immutable in the future but you cannot make
   * immutable NFTs mutable ever again.
   */
  readonly isMutable: boolean;

  /**
   * Wheter the minted NFTs should use the Candy Machine authority
   * as their update authority.
   *
   * We strongly recommend setting this to `true` unless you have a
   * specific reason. When set to `false`, the update authority will
   * be given to the address that minted the NFT and you will no longer
   * be able to update the minted NFTs in the future.
   */
  readonly retainAuthority: boolean;

  /**
   * The timestamp of when the Candy Machine will be live.
   *
   * If this is `null` or if the timestamp refers to a time in the
   * future, no one will be able to mint NFTs from the Candy Machine
   * (except its authority that can bypass this live date).
   */
  readonly goLiveDate: Option<DateTime>;

  /**
   * The maximum number of editions that can be printed from the
   * minted NFTs.
   *
   * For most use cases, you'd want to set this to `0` to prevent
   * minted NFTs to be printed multiple times.
   *
   * Note that you cannot set this to `null` which means unlimited editions
   * are not supported by the Candy Machine program.
   */
  readonly maxEditionSupply: BigNumber;

  /**
   * The parsed items that are loaded in the Candy Machine.
   *
   * If the Candy Machine is using hidden settings,
   * this will be an empty array.
   */
  readonly items: CandyMachineItem[];

  /**
   * The total number of items availble in the Candy Machine, minted or not.
   */
  readonly itemsAvailable: BigNumber;

  /**
   * The number of items that have been minted on this Candy Machine so far.
   */
  readonly itemsMinted: BigNumber;

  /**
   * The number of remaining items in the Candy Machine that can still be minted.
   */
  readonly itemsRemaining: BigNumber;

  /**
   * The number of items that have been inserted in the Candy Machine by
   * its authority. If this number if lower than the number of items
   * available, the Candy Machine is not ready and cannot be minted from.
   *
   * This field is irrelevant if the Candy Machine is using hidden settings.
   */
  readonly itemsLoaded: BigNumber;

  /**
   * Whether all items in the Candy Machine have been inserted by
   * its authority.
   *
   * This field is irrelevant if the Candy Machine is using hidden settings.
   */
  readonly isFullyLoaded: boolean;

  /**
   * An optional constraint defining when the Candy Machine will end.
   * If this is `null`, the Candy Machine will end when there are
   * no more items to mint from (i.e. `itemsRemaining` is `0`).
   */
  readonly endSettings: Option<CandyMachineEndSettings>;

  /** {@inheritDoc CandyMachineHiddenSettings} */
  readonly hiddenSettings: Option<CandyMachineHiddenSettings>;

  /** {@inheritDoc CandyMachineWhitelistMintSettings} */
  readonly whitelistMintSettings: Option<CandyMachineWhitelistMintSettings>;

  /** {@inheritDoc CandyMachineGatekeeper} */
  readonly gatekeeper: Option<CandyMachineGatekeeper>;

  /** {@inheritDoc Creator} */
  readonly creators: Creator[];
};

/** @group Models */
export type CandyMachineItem = {
  readonly name: string;
  readonly uri: string;
};

/**
 * End Settings provides a mechanism to stop the mint if a certain condition is
 * met without interaction.
 *
 * This type is a union type differentiated by the `endSettingType` field.
 * It can have one of the following values:
 *
 * - {@link CandyMachineEndSettingsAmount} if `endSettingType` is `EndSettingType.Amount`. \
 *   It ends a Candy Machine after a certain amount of items have been minted.
 * - {@link CandyMachineEndSettingsDate} if `endSettingType` is `EndSettingType.Date`. \
 *   It ends a Candy Machine after a certain date.
 *
 * @group Models
 */
export type CandyMachineEndSettings =
  | CandyMachineEndSettingsAmount
  | CandyMachineEndSettingsDate;

/**
 * The "Amount" end setting allows us to end a Candy Machine
 * after a certain amount of items have been minted.
 *
 * @group Models
 */
export type CandyMachineEndSettingsAmount = {
  /** Differentiates the types of end settings. */
  readonly endSettingType: EndSettingType.Amount;

  /** The maximum number of items to mint. */
  readonly number: BigNumber;
};

/**
 * The "Date" end setting allows us to end a Candy Machine
 * after a given date and time.
 *
 * @group Models
 */
export type CandyMachineEndSettingsDate = {
  /** Differentiates the types of end settings. */
  readonly endSettingType: EndSettingType.Date;

  /** The date after which the Candy Machine is closed. */
  readonly date: DateTime;
};

/**
 * An optional setting that makes items in the Candy Machine hidden by
 * providing a single URI for all minted NFTs and the hash of a file that
 * maps mint number to actual NFT URIs.
 *
 * Hidden settings serve two purposes.
 * - First, it allows the creation of larger drops (20k+), since
 *   the JSON metadata URIs are not stored on-chain for each item.
 * - In turn, this also allows the creation of hide-and-reveal drops,
 *   where users discover which items they minted after the mint is complete.
 *
 * Once hidden settings are enabled, every minted NFT will have the same URI and the
 * name will be created by appending the mint number (e.g., “#45”) to the specified
 * name. The hash is expected to be a 32 character string corresponding to
 * the hash of a cache file that has the mapping between a mint number and the
 * actual metadata URI. This allows the order of the mint to be verified by
 * others after the mint is complete.
 *
 * Since the metadata URIs are not on-chain, it is possible to create very large
 * drops. The only caveat is that there is a need for an off-chain process to
 * update the metadata for each item. This is important otherwise all items
 * will have the same metadata.
 *
 * @group Models
 */
export type CandyMachineHiddenSettings = {
  /**
   * The base name for all minted NFTs.
   * The number of the mint will be appended to this name.
   */
  readonly name: string;

  /**
   * The URI shared by all minted NFTs.
   */
  readonly uri: string;

  /**
   * A 32-character hash. In most cases this is the hash of the
   * cache file with the mapping between mint numbers and metadata URIs
   * so that the order can be verified when the mint is complete.
   */
  readonly hash: number[];
};

/**
 * Whitelist settings provide a variety of different use cases and revolve
 * around the idea of using custom SPL tokens to offer special rights to token
 * holders. How these SPL tokens are distributed is up to you.
 *
 * For example, you can offer a discount to token holders, you can allow token
 * holders to mint NFTs before everyone else, or a combination of both.
 *
 * @group Models
 */
export type CandyMachineWhitelistMintSettings = {
  /**
   * Determines how the whitelist token is used.
   * - `WhitelistMintMode.BurnEveryTime`: a whitelist token is burned every time an NFT is mint.
   * - `WhitelistMintMode.NeverBurn`: whitelist tokens are kept after minting.
   */
  readonly mode: WhitelistMintMode;

  /** The mint address of the whitelist token. */
  readonly mint: PublicKey;

  /** Indicates whether whitelist token holders can mint before the live date. */
  readonly presale: boolean;

  /**
   * The updated price for whitelist token holders.
   * When provided, this `discountPrice` will be used instead of the original `price`
   * for whitelist token holders only. When `null`, everybody will pay the original `price`.
   */
  readonly discountPrice: Option<Amount>;
};

/**
 * Gatekeeper settings allow us to protect ourselves against malicious actors such as bots.
 * Whilst the Candy Machine program itself has some protection mechanisms against bots,
 * you may want to add extra protection to ensure only humand can mint from your project.
 *
 * To enable gatekeeper settings, you must provide the address of a Gatekeeper Network
 * which usually encapsulates multiple gatekeeper providers and is responsible for
 * validating the legitimacy of the minting actor.
 *
 * @group Models
 */
export type CandyMachineGatekeeper = {
  /** The address of your desired Gatekeeper Network. */
  readonly network: PublicKey;

  /** Whether or not a new challenge should be required after each use. */
  readonly expireOnUse: boolean;
};

// -----------------
// Program to Model
// -----------------

/** @group Model Helpers */
export const isCandyMachine = (value: any): value is CandyMachine =>
  typeof value === 'object' && value.model === 'candyMachine';

/** @group Model Helpers */
export function assertCandyMachine(value: any): asserts value is CandyMachine {
  assert(isCandyMachine(value), 'Expected CandyMachine type');
}

/** @group Model Helpers */
export const toCandyMachine = (
  account: CandyMachineAccount,
  unparsedAccount: UnparsedAccount,
  collectionAccount: MaybeCandyMachineCollectionAccount | null
): CandyMachine => {
  const itemsAvailable = toBigNumber(account.data.data.itemsAvailable);
  const itemsMinted = toBigNumber(account.data.itemsRedeemed);

  const endSettings = account.data.data.endSettings;
  const hiddenSettings = account.data.data.hiddenSettings;
  const whitelistMintSettings = account.data.data.whitelistMintSettings;
  const gatekeeper = account.data.data.gatekeeper;

  const rawData = unparsedAccount.data;
  const itemsLoaded = hiddenSettings
    ? toBigNumber(0)
    : countCandyMachineItems(rawData);
  const items = hiddenSettings ? [] : parseCandyMachineItems(rawData);

  return {
    model: 'candyMachine',
    address: account.publicKey,
    programAddress: account.owner,
    version: account.owner.equals(CandyMachineProgram.publicKey) ? 2 : 1,
    authorityAddress: account.data.authority,
    walletAddress: account.data.wallet,
    tokenMintAddress: account.data.tokenMint,
    collectionMintAddress:
      collectionAccount && collectionAccount.exists
        ? collectionAccount.data.mint
        : null,
    uuid: account.data.data.uuid,

    // TODO(loris): Provide a more accurate Amount if `tokenMintAddress` is not `null`.
    price: lamports(account.data.data.price),
    symbol: removeEmptyChars(account.data.data.symbol),
    sellerFeeBasisPoints: account.data.data.sellerFeeBasisPoints,
    isMutable: account.data.data.isMutable,
    retainAuthority: account.data.data.retainAuthority,
    goLiveDate: toOptionDateTime(account.data.data.goLiveDate),
    maxEditionSupply: toBigNumber(account.data.data.maxSupply),
    items,
    itemsAvailable,
    itemsMinted,
    itemsRemaining: toBigNumber(itemsAvailable.sub(itemsMinted)),
    itemsLoaded,
    isFullyLoaded: itemsAvailable.lte(itemsLoaded),
    endSettings: endSettings
      ? endSettings.endSettingType === EndSettingType.Date
        ? {
            endSettingType: EndSettingType.Date,
            date: toDateTime(endSettings.number),
          }
        : {
            endSettingType: EndSettingType.Amount,
            number: toBigNumber(endSettings.number),
          }
      : null,
    hiddenSettings,
    whitelistMintSettings: whitelistMintSettings
      ? {
          ...whitelistMintSettings,
          discountPrice: whitelistMintSettings.discountPrice
            ? lamports(whitelistMintSettings.discountPrice)
            : null,
        }
      : null,
    gatekeeper: gatekeeper
      ? {
          ...gatekeeper,
          network: gatekeeper.gatekeeperNetwork,
        }
      : null,
    creators: account.data.data.creators,
  };
};

// -----------------
// Model to Configs
// -----------------

/** @group Models */
export type CandyMachineConfigs = {
  /**
   * The address of the wallet receiving the payments for minting NFTs.
   * If the Candy Machine accepts payments in SOL, this is the SOL treasury account.
   * Otherwise, this is the token account associated with the treasury Mint.
   *
   * @defaultValue `metaplex.identity().publicKey`
   */
  wallet: PublicKey;

  /**
   * The address of the Mint account of the SPL Token that should be used
   * to accept payments for minting NFTs. When `null`, it means the
   * Candy Machine account accepts payments in SOL.
   */
  tokenMint: Option<PublicKey>;

  /**
   * The price of minting an NFT.
   *
   * If the Candy Machine uses no treasury mint (i.e. the `tokenMintAddress`
   * is `null`), this amount will be in SOL. Otherwise, its currency will
   * match the currency of the treasury mint.
   *
   * @example
   * ```ts
   * { price: sol(1.5) } // For 1.5 SOL.
   * { price: token(320, 2, MYTOKEN) } // For 3.2 MYTOKEN which is a 2-decimal token.
   * ```
   */
  price: Amount;

  /**
   * The royalties that should be set on minted NFTs in basis points
   *
   * @example
   * ```ts
   * { sellerFeeBasisPoints: 250 } // For 2.5% royalties.
   * ```
   */
  sellerFeeBasisPoints: number;

  /**
   * The total number of items availble in the Candy Machine, minted or not.
   *
   * @example
   * ```ts
   * { itemsAvailable: toBigNumber(1000) } // For 1000 items.
   * ```
   */
  itemsAvailable: BigNumber;

  /**
   * The symbol to use when minting NFTs (e.g. "MYPROJECT")
   *
   * This can be any string up to 10 bytes and can be made optional
   * by providing an empty string.
   *
   * @defaultValue `""`
   */
  symbol: string;

  /**
   * The maximum number of editions that can be printed from the
   * minted NFTs.
   *
   * For most use cases, you'd want to set this to `0` to prevent
   * minted NFTs to be printed multiple times.
   *
   * Note that you cannot set this to `null` which means unlimited editions
   * are not supported by the Candy Machine program.
   *
   * @defaultValue `toBigNumber(0)`
   */
  maxEditionSupply: BigNumber;

  /**
   * Whether the minted NFTs should be mutable or not.
   *
   * We recommend setting this to `true` unless you have a specific reason.
   * You can always make NFTs immutable in the future but you cannot make
   * immutable NFTs mutable ever again.
   *
   * @defaultValue `true`
   */
  isMutable: boolean;

  /**
   * Wheter the minted NFTs should use the Candy Machine authority
   * as their update authority.
   *
   * We strongly recommend setting this to `true` unless you have a
   * specific reason. When set to `false`, the update authority will
   * be given to the address that minted the NFT and you will no longer
   * be able to update the minted NFTs in the future.
   *
   * @defaultValue `true`
   */
  retainAuthority: boolean;

  /**
   * The timestamp of when the Candy Machine will be live.
   *
   * If this is `null` or if the timestamp refers to a time in the
   * future, no one will be able to mint NFTs from the Candy Machine
   * (except its authority that can bypass this live date).
   *
   * @defaultValue `null`
   */
  goLiveDate: Option<DateTime>;

  /**
   * An optional constraint defining when the Candy Machine will end.
   * If this is `null`, the Candy Machine will end when there are
   * no more items to mint from (i.e. `itemsRemaining` is `0`).
   *
   * @defaultValue `null`
   */
  endSettings: Option<CandyMachineEndSettings>;

  /**
   * {@inheritDoc CandyMachineHiddenSettings}
   * @defaultValue `null`
   */
  hiddenSettings: Option<CandyMachineHiddenSettings>;

  /**
   * {@inheritDoc CandyMachineWhitelistMintSettings}
   * @defaultValue `null`
   */
  whitelistMintSettings: Option<CandyMachineWhitelistMintSettings>;

  /**
   * {@inheritDoc CandyMachineGatekeeper}
   * @defaultValue `null`
   */
  gatekeeper: Option<CandyMachineGatekeeper>;

  /**
   * {@inheritDoc Creator}
   * @defaultValue `null`
   * ```ts
   * [{
   *   address: metaplex.identity().publicKey,
   *   share: 100,
   *   verified: false,
   * }]
   * ```
   */
  creators: Creator[];
};

/** @group Model Helpers */
export const toCandyMachineConfigs = (
  candyMachine: CandyMachine
): CandyMachineConfigs => {
  return {
    wallet: candyMachine.walletAddress,
    tokenMint: candyMachine.tokenMintAddress,
    ...candyMachine,
  };
};

// -----------------
// Configs to Program
// -----------------

/** @group Models */
export type CandyMachineInstructionData = {
  wallet: PublicKey;
  tokenMint: Option<PublicKey>;
  data: CandyMachineData;
};

/** @group Model Helpers */
export const toCandyMachineInstructionData = (
  address: PublicKey,
  configs: CandyMachineConfigs
): CandyMachineInstructionData => {
  const endSettings = configs.endSettings;
  const whitelistMintSettings = configs.whitelistMintSettings;
  const gatekeeper = configs.gatekeeper;

  return {
    wallet: configs.wallet,
    tokenMint: configs.tokenMint,
    data: {
      ...configs,
      uuid: getCandyMachineUuidFromAddress(address),
      price: configs.price.basisPoints,
      maxSupply: configs.maxEditionSupply,
      endSettings: endSettings
        ? {
            ...endSettings,
            number:
              endSettings.endSettingType === EndSettingType.Date
                ? endSettings.date
                : endSettings.number,
          }
        : null,
      whitelistMintSettings: whitelistMintSettings
        ? {
            ...whitelistMintSettings,
            discountPrice:
              whitelistMintSettings.discountPrice?.basisPoints ?? null,
          }
        : null,
      gatekeeper: gatekeeper
        ? {
            ...gatekeeper,
            gatekeeperNetwork: gatekeeper.network,
          }
        : null,
    },
  };
};
