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
 */
export type FreezeTokenPaymentGuardSettings = {
  /** The mint address of the required tokens. */
  mint: PublicKey;

  /** The amount of tokens required to mint an NFT. */
  amount: SplTokenAmount;

  /** The associated token address to send the tokens to. */
  destinationAta: PublicKey;
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
