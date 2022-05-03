import { CandyMachine } from '@metaplex-foundation/mpl-candy-machine';
import { Connection, PublicKey } from '@solana/web3.js';
import { BaseAccount } from '../../../shared';
import { getSpaceForCandy } from './candyMachineSpace';

export class CandyMachineAccount extends BaseAccount<CandyMachine> {
  get size() {
    return getSpaceForCandy(this.data.data);
  }

  static async fromAccountAddress(
    connection: Connection,
    address: PublicKey
  ): Promise<CandyMachineAccount> {
    // TODO(thlorenz): solita could generate a method to get account info as we do here
    // However this is a lot of hoops to jump through instead of just using the method that
    // solita already provides. Having to convert things thrice (including during parse) also requires
    // lots of object copying affecting perf.
    const accountInfo = await connection.getAccountInfo(address);
    if (accountInfo == null) {
      throw new Error(`Unable to find CandyMachine account at ${address}`);
    }
    const unparsedAccount = { ...accountInfo, publicKey: address };
    const parsed = CandyMachineAccount.parse(unparsedAccount, CandyMachine);
    return new CandyMachineAccount(parsed);
  }
}
