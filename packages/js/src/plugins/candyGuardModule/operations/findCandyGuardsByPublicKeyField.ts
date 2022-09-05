import { UnreachableCaseError } from '@/errors';
import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import { DisposableScope, zipMap } from '@/utils';
import { Commitment, PublicKey } from '@solana/web3.js';
import { CandyGuardsSettings, DefaultCandyGuardSettings } from '../guards';
import { CandyGuard } from '../models';

// -----------------
// Operation
// -----------------

const Key = 'FindCandyGuardsByPublicKeyOperation' as const;

/**
 * Find all Candy Machines matching by a given `publicKey` or a given `type`.
 *
 * The following two types are supported.
 *
 * `authority`: Find Candy Machines whose authority is the given `publicKey`.
 * ```ts
 * const someAuthority = new PublicKey('...');
 * const candyGuards = await metaplex
 *   .candyGuards()
 *   .findAllBy({ type: 'authority', someAuthority });
 *   .run();
 * ```
 *
 * `wallet`: Find Candy Machines whose wallet address is the given `publicKey`.
 * ```ts
 * const someWallet = new PublicKey('...');
 * const candyGuards = await metaplex
 *   .candyGuards()
 *   .findAllBy({ type: 'wallet', someWallet });
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const findCandyGuardsByPublicKeyFieldOperation =
  useOperation<FindCandyGuardsByPublicKeyFieldOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindCandyGuardsByPublicKeyFieldOperation<
  GuardSettings extends CandyGuardsSettings = DefaultCandyGuardSettings
> = Operation<
  typeof Key,
  FindCandyGuardsByPublicKeyFieldInput,
  CandyGuard<GuardSettings>[]
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindCandyGuardsByPublicKeyFieldInput = {
  /** Defines which type of account the `publicKey` field refers to.  */
  type: 'authority' | 'wallet';

  /** The publicKey to filter Candy Machine by. */
  publicKey: PublicKey;

  /** The level of commitment desired when querying the blockchain. */
  commitment?: Commitment;
};

/**
 * @group Operations
 * @category Handlers
 */
export const findCandyGuardsByPublicKeyFieldOperationHandler: OperationHandler<FindCandyGuardsByPublicKeyFieldOperation> =
  {
    handle: async (
      operation: FindCandyGuardsByPublicKeyFieldOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ) => {
      const { type, publicKey, commitment } = operation.input;
      const accounts = CandyMachineProgram.accounts(metaplex).mergeConfig({
        commitment,
      });

      let candyMachineQuery: CandyMachineGpaBuilder;
      switch (type) {
        case 'authority':
          candyMachineQuery =
            accounts.candyMachineAccountsForAuthority(publicKey);
          break;
        case 'wallet':
          candyMachineQuery = accounts.candyMachineAccountsForWallet(publicKey);
          break;
        default:
          throw new UnreachableCaseError(type);
      }

      const unparsedAccounts = await candyMachineQuery.get();
      scope.throwIfCanceled();

      const collectionPdas = unparsedAccounts.map((unparsedAccount) =>
        findCandyMachineCollectionPda(unparsedAccount.publicKey)
      );
      const unparsedCollectionAccounts = await metaplex
        .rpc()
        .getMultipleAccounts(collectionPdas, commitment);
      scope.throwIfCanceled();

      return zipMap(
        unparsedAccounts,
        unparsedCollectionAccounts,
        (unparsedAccount, unparsedCollectionAccount) => {
          const account = parseCandyMachineAccount(unparsedAccount);
          const collectionAccount = unparsedCollectionAccount
            ? parseCandyMachineCollectionAccount(unparsedCollectionAccount)
            : null;

          return toCandyMachine(account, unparsedAccount, collectionAccount);
        }
      );
    },
  };
