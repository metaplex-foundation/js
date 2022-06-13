import { PublicKey } from '@solana/web3.js';
import { Operation, OperationHandler, useOperation } from '@/types';
import { Metaplex } from '@/Metaplex';
import { CandyMachine } from './CandyMachine';
import { CandyMachineProgram, parseCandyMachineAccount } from '../../programs';
import { UnreachableCaseError } from '../../errors';

// -----------------
// Operation
// -----------------
const Key = 'FindCandyMachinesByPublicKeyOperation' as const;

export const findCandyMachinesByPublicKeyFieldOperation =
  useOperation<FindCandyMachinesByPublicKeyFieldOperation>(Key);

export type FindCandyMachinesByPublicKeyFieldInput = {
  type: 'authority' | 'wallet';
  publicKey: PublicKey;
};
export type FindCandyMachinesByPublicKeyFieldOperation = Operation<
  typeof Key,
  FindCandyMachinesByPublicKeyFieldInput,
  CandyMachine[]
>;

// -----------------
// Handler
// -----------------
export const findCandyMachinesByPublicKeyFieldOnChainOperationHandler: OperationHandler<FindCandyMachinesByPublicKeyFieldOperation> =
  {
    handle: async (
      operation: FindCandyMachinesByPublicKeyFieldOperation,
      metaplex: Metaplex
    ): Promise<CandyMachine[]> => {
      const { type, publicKey } = operation.input;
      const accounts = CandyMachineProgram.accounts(metaplex);
      let candyMachineQuery;
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

      const candyMachineUnparseds = await candyMachineQuery.get();
      return candyMachineUnparseds.map((unparsedAccount) => {
        const account = parseCandyMachineAccount(unparsedAccount);
        return CandyMachine.fromAccount(account, unparsedAccount.data);
      });
    },
  };
