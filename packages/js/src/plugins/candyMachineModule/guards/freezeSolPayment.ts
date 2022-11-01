import { Buffer } from 'buffer';
import {
  FreezeSolPayment,
  freezeSolPaymentBeet,
} from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';
import {
  createSerializerFromBeet,
  lamports,
  mapSerializer,
  PublicKey,
  SolAmount,
} from '@/types';

/**
 * The solPayment guard allows minting frozen NFTs by charging
 * the payer an amount in SOL. Frozen NFTs cannot be transferred
 * or listed on any marketplaces until thawed.
 *
 * The funds are transferred to a freeze escrow until all NFTs are thaw,
 * at which point, they can be transferred (unlocked) to the configured
 * destination account.
 *
 * This object defines the settings that should be
 * provided when creating and/or updating a Candy
 * Machine if you wish to enable this guard.
 */
export type FreezeSolPaymentGuardSettings = {
  /** The amount in SOL to charge for. */
  amount: SolAmount;

  /** The configured destination address to send the funds to. */
  destination: PublicKey;
};

/** @internal */
export const freezeSolPaymentGuardManifest: CandyGuardManifest<FreezeSolPaymentGuardSettings> =
  {
    name: 'freezeSolPayment',
    settingsBytes: 40,
    settingsSerializer: mapSerializer<
      FreezeSolPayment,
      FreezeSolPaymentGuardSettings
    >(
      createSerializerFromBeet(freezeSolPaymentBeet),
      (settings) => ({
        amount: lamports(settings.lamports),
        destination: settings.destination,
      }),
      (settings) => ({
        lamports: settings.amount.basisPoints,
        destination: settings.destination,
      })
    ),
    mintSettingsParser: ({
      metaplex,
      settings,
      mint,
      payer,
      candyMachine,
      candyGuard,
      programs,
    }) => {
      const freezeEscrow = metaplex.candyMachines().pdas().freezeEscrow({
        destination: settings.destination,
        candyMachine,
        candyGuard,
        programs,
      });
      const nftAta = metaplex.tokens().pdas().associatedTokenAccount({
        mint: mint.publicKey,
        owner: payer.publicKey,
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
        ],
      };
    },
  };
