import { Buffer } from 'buffer';
import {
  FreezeTokenPayment,
  freezeTokenPaymentBeet,
} from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';
import {
  createSerializerFromBeet,
  mapSerializer,
  PublicKey,
  Signer,
  SplTokenAmount,
  token,
} from '@/types';

/**
 * The freezeTokenPayment guard allows minting frozen NFTs by charging
 * the payer a specific amount of tokens from a certain mint acount.
 * Frozen NFTs cannot be transferred or listed on any marketplaces until thawed.
 *
 * The funds are transferred to a freeze escrow until all NFTs are thaw,
 * at which point, they can be transferred (unlocked) to the configured
 * destination account.
 *
 * This object defines the settings that should be
 * provided when creating and/or updating a Candy
 * Machine if you wish to enable this guard.
 *
 * @see {@link FreezeTokenPaymentGuardRouteSettings} to learn more about
 * the instructions that can be executed against this guard.
 */
export type FreezeTokenPaymentGuardSettings = {
  /** The mint address of the required tokens. */
  mint: PublicKey;

  /** The amount of tokens required to mint an NFT. */
  amount: SplTokenAmount;

  /** The associated token address to send the tokens to. */
  destinationAta: PublicKey;
};

/**
 * The settings for the freezeTokenPayment guard that should be provided
 * when accessing the guard's special "route" instruction.
 *
 * ## Initialize
 * The `initialize` path creates the freeze escrow account that will
 * hold the funds until all NFTs are thawed. It must be called before
 * any NFTs can be minted.
 *
 * ```ts
 * await metaplex.candyMachines().callGuardRoute({
 *   candyMachine,
 *   guard: 'freezeTokenPayment',
 *   settings: {
 *     path: 'initialize',
 *     period: 15 * 24 * 60 * 60, // 15 days.
 *     candyGuardAuthority,
 *   },
 * });
 * ```
 *
 * ## Thaw
 * The `thaw` path unfreezes one NFT if one of the following conditions are met:
 * - All NFTs have been minted.
 * - The configured period has elapsed (max 30 days).
 * - The `freezeTokenPayment` guard was removed.
 *
 * Anyone can call this instruction. Since the funds are not transferrable
 * until all NFTs are thawed, it creates an incentive for the treasury to
 * thaw all NFTs as soon as possible.
 *
 * ```ts
 * await metaplex.candyMachines().callGuardRoute({
 *   candyMachine,
 *   guard: 'freezeTokenPayment',
 *   settings: {
 *     path: 'thaw',
 *     nftMint: nftToThaw.address,
 *     nftOwner: nftToThaw.token.ownerAddress,
 *   },
 * });
 * ```
 *
 * ## Unlock Funds
 * The `unlockFunds` path transfers all of the escrow funds to the
 * configured destination token address once all NFTs have been thawed.
 *
 * ```ts
 * await metaplex.candyMachines().callGuardRoute({
 *   candyMachine,
 *   guard: 'freezeTokenPayment',
 *   settings: {
 *     path: 'unlockFunds',
 *     candyGuardAuthority,
 *   },
 * });
 * ```
 *
 * @see {@link FreezeTokenPaymentGuardSettings} for more
 * information on the freezeTokenPayment guard itself.
 */
export type FreezeTokenPaymentGuardRouteSettings =
  | {
      /** Selects the path to execute in the route instruction. */
      path: 'initialize';

      /** The freeze period in seconds (maximum 30 days). */
      period: number;

      /** The authority of the Candy Guard as a Signer. */
      candyGuardAuthority: Signer;
    }
  | {
      /** Selects the path to execute in the route instruction. */
      path: 'thaw';

      /** The mint address of the NFT to thaw. */
      nftMint: PublicKey;

      /** The owner address of the NFT to thaw. */
      nftOwner: PublicKey;
    }
  | {
      /** Selects the path to execute in the route instruction. */
      path: 'unlockFunds';

      /** The authority of the Candy Guard as a Signer. */
      candyGuardAuthority: Signer;
    };

/** @internal */
export const freezeTokenPaymentGuardManifest: CandyGuardManifest<FreezeTokenPaymentGuardSettings> =
  {
    name: 'freezeTokenPayment',
    settingsBytes: 72,
    settingsSerializer: mapSerializer<
      FreezeTokenPayment,
      FreezeTokenPaymentGuardSettings
    >(
      createSerializerFromBeet(freezeTokenPaymentBeet),
      (settings) => ({
        mint: settings.mint,
        amount: token(settings.amount),
        destinationAta: settings.destinationAta,
      }),
      (settings) => ({
        mint: settings.mint,
        amount: settings.amount.basisPoints,
        destinationAta: settings.destinationAta,
      })
    ),
    mintSettingsParser: ({
      metaplex,
      settings,
      payer,
      mint: nftMint,
      candyMachine,
      candyGuard,
      programs,
    }) => {
      const freezeEscrow = metaplex.candyMachines().pdas().freezeEscrow({
        destination: settings.destinationAta,
        candyMachine,
        candyGuard,
        programs,
      });
      const nftAta = metaplex.tokens().pdas().associatedTokenAccount({
        mint: nftMint.publicKey,
        owner: payer.publicKey,
      });
      const tokenAddress = metaplex.tokens().pdas().associatedTokenAccount({
        mint: settings.mint,
        owner: payer.publicKey,
        programs,
      });
      const freezeAta = metaplex.tokens().pdas().associatedTokenAccount({
        mint: nftMint.publicKey,
        owner: freezeEscrow,
        programs,
      });

      return {
        arguments: Buffer.from([]),
        remainingAccounts: [
          {
            isSigner: false,
            address: freezeEscrow,
            isWritable: true,
          },
          {
            isSigner: false,
            address: nftAta,
            isWritable: false,
          },
          {
            isSigner: false,
            address: tokenAddress,
            isWritable: false,
          },
          {
            isSigner: false,
            address: freezeAta,
            isWritable: false,
          },
        ],
        routeSettingsParser: () => {
          return {
            arguments: Buffer.from([]),
            remainingAccounts: [],
          };
        },
      };
    },
  };
