import { Commitment, PublicKey } from '@solana/web3.js';
import { findNftsByCreatorOperation, Metadata, Nft } from '../../nftModule';
import { findCandyMachineV2CreatorPda } from '../pdas';
import { Metaplex } from '@metaplex-foundation/js-core/Metaplex';
import {
  Operation,
  OperationHandler,
  useOperation,
} from '@metaplex-foundation/js-core';
import { DisposableScope } from '@metaplex-foundation/js-core';

// -----------------
// Operation
// -----------------

const Key = 'FindMintedNftsByCandyMachineV2Operation' as const;

/**
 * Find all minted NFTs from a given Candy Machine address.
 *
 * ```ts
 * const nfts = await metaplex
 *   .candyMachinesV2()
 *   .findMintedNfts({ candyMachine })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const findMintedNftsByCandyMachineV2Operation =
  useOperation<FindMintedNftsByCandyMachineV2Operation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindMintedNftsByCandyMachineV2Operation = Operation<
  typeof Key,
  FindMintedNftsByCandyMachineV2Input,
  FindMintedNftsByCandyMachineV2Output
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindMintedNftsByCandyMachineV2Input = {
  /** The Candy Machine address. */
  candyMachine: PublicKey;

  /**
   * The Candy Machine version
   *
   * @defaultValue `2`
   */
  version?: 1 | 2;

  /** The level of commitment desired when querying the blockchain. */
  commitment?: Commitment;
};

/**
 * @group Operations
 * @category Outputs
 */
export type FindMintedNftsByCandyMachineV2Output = (Metadata | Nft)[];

/**
 * @group Operations
 * @category Handlers
 */
export const findMintedNftsByCandyMachineV2OperationHandler: OperationHandler<FindMintedNftsByCandyMachineV2Operation> =
  {
    handle: async (
      operation: FindMintedNftsByCandyMachineV2Operation,
      metaplex: Metaplex,
      scope: DisposableScope
    ) => {
      const { candyMachine, version = 2, commitment } = operation.input;
      const firstCreator =
        version === 2
          ? findCandyMachineV2CreatorPda(candyMachine)
          : candyMachine;

      const mintedNfts = await metaplex.operations().execute(
        findNftsByCreatorOperation({
          creator: firstCreator,
          position: 1,
          commitment,
        }),
        scope
      );

      return mintedNfts as (Nft | Metadata)[];
    },
  };
