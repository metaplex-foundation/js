import { Commitment, PublicKey } from '@solana/web3.js';
import { Operation, OperationHandler, useOperation } from '@/types';
import { Metaplex } from '@/Metaplex';
import { CandyMachine, makeCandyMachineModel } from './CandyMachine';
import { parseCandyMachineAccount } from './accounts';
import { CandyMachineProgram } from './program';
import { UnreachableCaseError } from '@/errors';
import { CandyMachineGpaBuilder } from './gpaBuilders';

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

export const findCandyMachinesByPublicKeyFieldOnChainOperationHandler: OperationHandler<FindCandyMachinesByPublicKeyFieldOperation> =
  {
    handle: async (
      operation: FindCandyMachinesByPublicKeyFieldOperation,
      metaplex: Metaplex
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

      return unparsedAccounts.map((unparsedAccount) => {
        const account = parseCandyMachineAccount(unparsedAccount);
        return makeCandyMachineModel(account, unparsedAccount);
      });
    },
  };
