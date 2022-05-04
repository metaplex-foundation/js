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
    // TODO(thlorenz): should pass in UnparsedAccount here which is obtained
    // via the `metaplex.rpc()` driver
    const accountInfo = await connection.getAccountInfo(address);
    if (accountInfo == null) {
      throw new Error(`Unable to find CandyMachine account at ${address}`);
    }
    const unparsedAccount = { ...accountInfo, publicKey: address };
    const parsed = CandyMachineAccount.parse(unparsedAccount, CandyMachine);
    return new CandyMachineAccount(parsed);
  }
}
