import { Commitment, PublicKey } from '@solana/web3.js';
import { Operation, OperationHandler, useOperation } from '@/types';
import { Metaplex } from '@/Metaplex';
import { CandyMachine, toCandyMachine } from './CandyMachine';
import {
  parseCandyMachineAccount,
  parseCandyMachineCollectionAccount,
} from './accounts';
import { CandyMachineProgram } from './program';
import { UnreachableCaseError } from '@/errors';
import { CandyMachineGpaBuilder } from './gpaBuilders';
import { findCandyMachineCollectionPda } from './pdas';
import { DisposableScope, zipMap } from '@/utils';

// -----------------
// Operation
// -----------------

const Key = 'FindCandyMachinesByPublicKeyOperation' as const;
export const findCandyMachinesByPublicKeyFieldOperation =
  useOperation<FindCandyMachinesByPublicKeyFieldOperation>(Key);
export type FindCandyMachinesByPublicKeyFieldOperation = Operation<
  typeof Key,
  FindCandyMachinesByPublicKeyFieldInput,
  CandyMachine[]
>;

export type FindCandyMachinesByPublicKeyFieldInput = {
  type: 'authority' | 'wallet';
  publicKey: PublicKey;
  commitment?: Commitment;
};

// -----------------
// Handler
// -----------------

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
