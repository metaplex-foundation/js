import { CandyMachine } from '@metaplex-foundation/mpl-candy-machine';
import { BaseAccount, UnparsedAccount, UnparsedMaybeAccount } from '@/types';
import { getConfigLinesCount, getSpaceForCandy } from './candyMachineInternals';

export class CandyMachineAccount extends BaseAccount<CandyMachine> {
  get size() {
    return getSpaceForCandy(this.data.data);
  }

  static getConfigLinesCount(rawData: Buffer) {
    return getConfigLinesCount(rawData);
  }

  static from(unparsedAccount: UnparsedAccount) {
    return new CandyMachineAccount(
      CandyMachineAccount.parse(unparsedAccount, CandyMachine)
    );
  }

  static fromMaybe(maybe: UnparsedMaybeAccount) {
    return maybe.exists ? CandyMachineAccount.from(maybe) : maybe;
  }
}
