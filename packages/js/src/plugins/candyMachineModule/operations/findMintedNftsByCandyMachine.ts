import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import { DisposableScope } from '@/utils';
import { Commitment, PublicKey } from '@solana/web3.js';
import { findNftsByCreatorOperation, Metadata, Nft } from '../../nftModule';
import { findCandyMachineCreatorPda } from '../pdas';

// -----------------
// Operation
// -----------------

const Key = 'FindMintedNftsByCandyMachineOperation' as const;

/**
 * Find all minted NFTs from a given Candy Machine address.
 *
 * ```ts
 * const nfts = await metaplex
 *   .candyMachines()
 *   .findMintedNfts({ candyMachine })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const findMintedNftsByCandyMachineOperation =
  useOperation<FindMintedNftsByCandyMachineOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindMintedNftsByCandyMachineOperation = Operation<
  typeof Key,
  FindMintedNftsByCandyMachineInput,
  FindMintedNftsByCandyMachineOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindMintedNftsByCandyMachineInput = {
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
export type FindMintedNftsByCandyMachineOutput = (Metadata | Nft)[];

/**
 * @group Operations
 * @category Handlers
 */
export const findMintedNftsByCandyMachineOperationHandler: OperationHandler<FindMintedNftsByCandyMachineOperation> =
  {
    handle: async (
      operation: FindMintedNftsByCandyMachineOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ) => {
      const { candyMachine, version = 2, commitment } = operation.input;
      const firstCreator =
        version === 2 ? findCandyMachineCreatorPda(candyMachine) : candyMachine;

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
