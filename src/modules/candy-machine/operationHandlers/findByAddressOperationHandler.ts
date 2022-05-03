import { Metaplex } from '../../../Metaplex';
import { CandyMachineAccount } from '../../../programs/candyMachine';
import { OperationHandler } from '../../../shared';
import { CandyMachine } from '../models';
import { FindCandyMachineByAdddressOperation } from '../operations';

export const findCandyMachineByAdddressOperationHandler: OperationHandler<FindCandyMachineByAdddressOperation> =
  {
    handle: async (operation: FindCandyMachineByAdddressOperation, metaplex: Metaplex) => {
      const candyMachineAddress = operation.input;
      const account = await CandyMachineAccount.fromAccountAddress(
        metaplex.connection,
        candyMachineAddress
      );
      return CandyMachine.fromAccount(account);
    },
  };
