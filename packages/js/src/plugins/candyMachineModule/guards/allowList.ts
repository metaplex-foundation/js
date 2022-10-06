import { Buffer } from 'buffer';
import * as beet from '@metaplex-foundation/beet';
import { AllowList, allowListBeet } from '@metaplex-foundation/mpl-candy-guard';
import { GuardMintSettingsMissingError } from '../errors';
import { CandyGuardManifest } from './core';
import { createSerializerFromBeet, mapSerializer } from '@/types';

/**
 * The allowList guard validates the minting wallet against
 * a predefined list of wallets.
 *
 * Instead of passing the entire list of wallets as settings,
 * this guard accepts the Root of a Merkle Tree created from
 * this allow list. The program can then validate that the minting
 * wallet is part of the allow list by requiring a Merkle Proof.
 * Minting will fail if either the minting address is not part of
 * the merkle tree or if no Merkle Proof is specified.
 *
 * You may use the `getMerkleRoot` and `getMerkleProof` helper
 * functions provided by the SDK to help you set up this guard.
 * Here is an example.
 *
 * ```ts
 * import { getMerkleProof, getMerkleRoot } from '@metaplex-foundation/js';
 * const allowList = [
 *   'Ur1CbWSGsXCdedknRbJsEk7urwAvu1uddmQv51nAnXB',
 *   'GjwcWFQYzemBtpUoN5fMAP2FZviTtMRWCmrppGuTthJS',
 *   'AT8nPwujHAD14cLojTcB1qdBzA1VXnT6LVGuUd6Y73Cy',
 * ];
 * const merkleRoot = getMerkleRoot(allowList);
 * const validMerkleProof = getMerkleProof(allowList, 'Ur1CbWSGsXCdedknRbJsEk7urwAvu1uddmQv51nAnXB');
 * const invalidMerkleProof = getMerkleProof(allowList, 'invalid-address');
 * ```
 *
 * This object defines the settings that should be
 * provided when creating and/or updating a Candy
 * Machine if you wish to enable this guard.
 *
 * @see {@link AllowListGuardMintSettings} for more
 * information on the mint settings of this guard.
 * @see {@link AllowListGuardRouteSettings} to learn more about
 * the instructions that can be executed against this guard.
 */
export type AllowListGuardSettings = {
  /**
   * The Root of the Merkle Tree representing the allow list.
   * You may use the `getMerkleRoot` helper function to generate this.
   */
  merkleRoot: Uint8Array;
};

/**
 * The settings for the allowList guard that could
 * be provided when minting from the Candy Machine.
 *
 * @see {@link AllowListGuardSettings} for more
 * information on the allowList guard itself.
 */
export type AllowListGuardMintSettings = {
  /**
   * The Proof that the minting wallet is part of the
   * Merkle Tree-based allow list. You may use the
   * `getMerkleProof` helper function to generate this.
   */
  merkleProof: Uint8Array[];
};

/**
 * The settings for the allowList guard that should
 * be provided when accessing the guard's special
 * "route" instruction.
 *
 * @see {@link AllowListGuardSettings} for more
 * information on the allowList guard itself.
 */
export type AllowListGuardRouteSettings = {
  /** Selects the route to execute. */
  route: 'proof';

  /**
   * The Proof that the minting wallet is part of the
   * Merkle Tree-based allow list. You may use the
   * `getMerkleProof` helper function to generate this.
   */
  merkleProof: Uint8Array[];
};

/** @internal */
export const allowListGuardManifest: CandyGuardManifest<
  AllowListGuardSettings,
  AllowListGuardMintSettings,
  AllowListGuardRouteSettings
> = {
  name: 'allowList',
  settingsBytes: 32,
  settingsSerializer: mapSerializer<AllowList, AllowListGuardSettings>(
    createSerializerFromBeet(allowListBeet),
    (settings) => ({ merkleRoot: new Uint8Array(settings.merkleRoot) }),
    (settings) => ({ merkleRoot: Array.from(settings.merkleRoot) })
  ),
  mintSettingsParser: ({ mintSettings }) => {
    if (!mintSettings) {
      throw new GuardMintSettingsMissingError('allowList');
    }

    const proof = mintSettings.merkleProof;
    const vectorSize = Buffer.alloc(4);
    beet.u32.write(vectorSize, 0, proof.length);

    return {
      arguments: Buffer.concat([vectorSize, ...proof]),
      remainingAccounts: [],
    };
  },
  routeSettingsParser: ({ routeSettings }) => {
    const proof = routeSettings.merkleProof;
    const vectorSize = Buffer.alloc(4);
    beet.u32.write(vectorSize, 0, proof.length);

    return {
      arguments: Buffer.concat([vectorSize, ...proof]),
      remainingAccounts: [],
    };
  },
};
