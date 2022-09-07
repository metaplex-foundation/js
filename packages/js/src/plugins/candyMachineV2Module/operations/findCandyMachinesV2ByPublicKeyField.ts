import { UnreachableCaseError } from '@/errors';
import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import { DisposableScope, zipMap } from '@/utils';
import { Commitment, PublicKey } from '@solana/web3.js';
import {
  parseCandyMachineV2Account,
  parseCandyMachineV2CollectionAccount,
} from '../accounts';
import { CandyMachineV2GpaBuilder } from '../gpaBuilders';
import { CandyMachineV2, toCandyMachineV2 } from '../models';
import { findCandyMachineV2CollectionPda } from '../pdas';
import { CandyMachineV2Program } from '../program';

// -----------------
// Operation
// -----------------

const Key = 'FindCandyMachinesV2ByPublicKeyOperation' as const;

/**
 * Find all Candy Machines matching by a given `publicKey` or a given `type`.
 *
 * The following two types are supported.
 *
 * `authority`: Find Candy Machines whose authority is the given `publicKey`.
 * ```ts
 * const someAuthority = new PublicKey('...');
 * const candyMachines = await metaplex
 *   .candyMachinesV2()
 *   .findAllBy({ type: 'authority', someAuthority });
 *   .run();
 * ```
 *
 * `wallet`: Find Candy Machines whose wallet address is the given `publicKey`.
 * ```ts
 * const someWallet = new PublicKey('...');
 * const candyMachines = await metaplex
 *   .candyMachinesV2()
 *   .findAllBy({ type: 'wallet', someWallet });
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const findCandyMachinesV2ByPublicKeyFieldOperation =
  useOperation<FindCandyMachinesV2ByPublicKeyFieldOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindCandyMachinesV2ByPublicKeyFieldOperation = Operation<
  typeof Key,
  FindCandyMachinesV2ByPublicKeyFieldInput,
  CandyMachineV2[]
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindCandyMachinesV2ByPublicKeyFieldInput = {
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
export const findCandyMachinesV2ByPublicKeyFieldOperationHandler: OperationHandler<FindCandyMachinesV2ByPublicKeyFieldOperation> =
  {
    handle: async (
      operation: FindCandyMachinesV2ByPublicKeyFieldOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<CandyMachineV2[]> => {
      const { type, publicKey, commitment } = operation.input;
      const accounts = CandyMachineV2Program.accounts(metaplex).mergeConfig({
        commitment,
      });

      let candyMachineQuery: CandyMachineV2GpaBuilder;
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
        findCandyMachineV2CollectionPda(unparsedAccount.publicKey)
      );
      const unparsedCollectionAccounts = await metaplex
        .rpc()
        .getMultipleAccounts(collectionPdas, commitment);
      scope.throwIfCanceled();

      return zipMap(
        unparsedAccounts,
        unparsedCollectionAccounts,
        (unparsedAccount, unparsedCollectionAccount) => {
          const account = parseCandyMachineV2Account(unparsedAccount);
          const collectionAccount = unparsedCollectionAccount
            ? parseCandyMachineV2CollectionAccount(unparsedCollectionAccount)
            : null;

          return toCandyMachineV2(account, unparsedAccount, collectionAccount);
        }
      );
    },
  };
