import { Metaplex } from '@/Metaplex';
import {
  assertAccountExists,
  Operation,
  OperationHandler,
  PublicKey,
} from '@/types';
import { DisposableScope } from '@/utils';
import { Commitment } from '@solana/web3.js';
import { CandyGuardsSettings, DefaultCandyGuardSettings } from '../guards';
import { CandyMachine, toCandyGuard, toCandyMachine } from '../models';
import { findCandyGuardPda } from '../pdas';
import { assertCandyGuardProgram } from '../programs';

// -----------------
// Operation
// -----------------

const Key = 'FindCandyMachineByAddressOperation' as const;

/**
 * TODO
 *
 * ```ts
 * const { candyMachine } = await metaplex
 *   .candyMachines()
 *   .create({
 *   })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const findCandyMachineByAddressOperation = <
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
>(
  input: FindCandyMachineByAddressInput
): FindCandyMachineByAddressOperation<T> => ({ key: Key, input });
findCandyMachineByAddressOperation.key = Key;

/**
 * @group Operations
 * @category Types
 */
export type FindCandyMachineByAddressOperation<
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
> = Operation<
  typeof Key,
  FindCandyMachineByAddressInput,
  FindCandyMachineByAddressOutput<T>
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindCandyMachineByAddressInput = {
  /** The Candy Machine address. */
  address: PublicKey;

  /** The level of commitment desired when querying the blockchain. */
  commitment?: Commitment;
};

/**
 * @group Operations
 * @category Outputs
 */
export type FindCandyMachineByAddressOutput<
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
> = CandyMachine<T>;

/**
 * @group Operations
 * @category Handlers
 */
export const findCandyMachineByAddressOperationHandler: OperationHandler<FindCandyMachineByAddressOperation> =
  {
    async handle<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(
      operation: FindCandyMachineByAddressOperation<T>,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<FindCandyMachineByAddressOutput<T>> {
      const { address, commitment } = operation.input;
      const potentialCandyGuardAddress = findCandyGuardPda(address);
      const [candyMachineAccount, potentialCandyGuardAccount] = await metaplex
        .rpc()
        .getMultipleAccounts([address, potentialCandyGuardAddress], commitment);
      scope.throwIfCanceled();

      assertAccountExists(candyMachineAccount, 'CandyMachine');
      const candyMachine = toCandyMachine<T>(candyMachineAccount);
      const mintAuthority = candyMachine.mintAuthorityAddress;

      // Optimisation that tries to load both the Candy Machine
      // And the Candy Guard in one RPC call assuming the Candy
      // Machine's address is the base address of the Candy Guard.
      if (
        potentialCandyGuardAccount.exists &&
        potentialCandyGuardAccount.publicKey.equals(mintAuthority)
      ) {
        return {
          ...candyMachine,
          candyGuard: toCandyGuard<T>(potentialCandyGuardAccount, metaplex),
        };
      }

      // If the Candy Machine's mint authority is not a PDA,
      // it cannot have an associated Candy Guard.
      if (PublicKey.isOnCurve(mintAuthority)) {
        return candyMachine;
      }

      // Fetch the content of the mint authority PDA.
      const mintAuthorityAccount = await metaplex
        .rpc()
        .getAccount(mintAuthority, commitment);
      scope.throwIfCanceled();

      try {
        // Identity the program owner as a Candy Guard program
        // and parse the Candy Guard accordingly.
        assertAccountExists(mintAuthorityAccount);
        const program = metaplex.programs().get(mintAuthorityAccount.owner);
        assertCandyGuardProgram(program);

        return {
          ...candyMachine,
          candyGuard: toCandyGuard<T>(mintAuthorityAccount, metaplex),
        };
      } catch (error) {
        // If anything goes wrong, assume there is no Candy Guard
        // attached to this Candy Machine.
        return candyMachine;
      }
    },
  };
