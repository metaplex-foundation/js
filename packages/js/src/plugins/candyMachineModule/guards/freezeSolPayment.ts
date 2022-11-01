import { Buffer } from 'buffer';
import * as beet from '@metaplex-foundation/beet';
import {
  FreezeSolPayment,
  freezeSolPaymentBeet,
} from '@metaplex-foundation/mpl-candy-guard';
import { UnrecognizePathForRouteInstructionError } from '../errors';
import {
  CandyGuardManifest,
  RouteSettingsParserInput,
  CandyGuardsRemainingAccount,
} from './core';
import {
  BigNumber,
  createSerializerFromBeet,
  lamports,
  mapSerializer,
  PublicKey,
  Signer,
  SolAmount,
} from '@/types';
import { assert } from '@/utils';

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
 *
 * @see {@link FreezeSolPaymentGuardRouteSettings} to learn more about
 * the instructions that can be executed against this guard.
 */
export type FreezeSolPaymentGuardSettings = {
  /** The amount in SOL to charge for. */
  amount: SolAmount;

  /** The configured destination address to send the funds to. */
  destination: PublicKey;
};

/**
 * TODO(loris): Document
 */
export type FreezeSolPaymentGuardRouteSettings = {
  /** Selects the path to execute in the route instruction. */
  path: 'initialize';

  /** The freeze period in seconds (maximum 30 days). */
  period: BigNumber;

  /** The authority of the Candy Guard as a Signer. */
  candyGuardAuthority: Signer;
};

/** @internal */
export const freezeSolPaymentGuardManifest: CandyGuardManifest<
  FreezeSolPaymentGuardSettings,
  {},
  FreezeSolPaymentGuardRouteSettings
> = {
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
  routeSettingsParser: (input) => {
    if (input.routeSettings.path === 'initialize') {
      return initializeRouteInstruction(input);
    }

    throw new UnrecognizePathForRouteInstructionError(
      'freezeSolPayment',
      input.routeSettings.path
    );
  },
};

const initializeRouteInstruction = ({
  metaplex,
  settings,
  routeSettings,
  candyMachine,
  candyGuard,
  programs,
}: RouteSettingsParserInput<
  FreezeSolPaymentGuardSettings,
  FreezeSolPaymentGuardRouteSettings
>) => {
  assert(
    routeSettings.path === 'initialize',
    'Route path must be "initialize"'
  );

  const freezeEscrow = metaplex.candyMachines().pdas().freezeEscrow({
    destination: settings.destination,
    candyMachine,
    candyGuard,
    programs,
  });
  const systemProgram = metaplex.programs().getSystem();

  const args = Buffer.alloc(9);
  beet.u8.write(args, 0, 1);
  beet.u64.write(args, 1, routeSettings.period);

  return {
    arguments: args,
    remainingAccounts: [
      {
        isSigner: false,
        address: freezeEscrow,
        isWritable: true,
      },
      {
        isSigner: true,
        address: routeSettings.candyGuardAuthority,
        isWritable: false,
      },
      {
        isSigner: false,
        address: systemProgram.address,
        isWritable: false,
      },
    ] as CandyGuardsRemainingAccount[],
  };
};
