import { UnreachableCaseError } from '@/errors';
import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import { DisposableScope, zipMap } from '@/utils';
import { Commitment, PublicKey } from '@solana/web3.js';
import {
  parseCandyMachineAccount,
  parseCandyMachineCollectionAccount,
} from '../accounts';
import { CandyMachineGpaBuilder } from '../gpaBuilders';
import { CandyMachine, toCandyMachine } from '../models/CandyMachine';
import { findCandyMachineCollectionPda } from '../pdas';
import { CandyMachineProgram } from '../program';

// -----------------
// Operation
// -----------------

const Key = 'FindCandyMachinesByPublicKeyOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const findCandyMachinesByPublicKeyFieldOperation =
  useOperation<FindCandyMachinesByPublicKeyFieldOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindCandyMachinesByPublicKeyFieldOperation = Operation<
  typeof Key,
  FindCandyMachinesByPublicKeyFieldInput,
  CandyMachine[]
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindCandyMachinesByPublicKeyFieldInput = {
  type: 'authority' | 'wallet';
  publicKey: PublicKey;
  commitment?: Commitment;
};

/**
 * @group Operations
 * @category Handlers
 */
export const findCandyMachinesByPublicKeyFieldOperationHandler: OperationHandler<FindCandyMachinesByPublicKeyFieldOperation> =
  {
    handle: async (
      operation: FindCandyMachinesByPublicKeyFieldOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<CandyMachine[]> => {
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
