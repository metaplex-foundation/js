import { CandyMachine, Creator } from '@metaplex-foundation/mpl-candy-machine';
import { BaseAccount, UnparsedAccount, UnparsedMaybeAccount } from '@/types';
import {
  assertCreators,
  assertName,
  assertSymbol,
  assertUri,
  getConfigLines,
  getConfigLinesCount,
  getSpaceForCandy,
} from './candyMachineInternals';

export class CandyMachineAccount extends BaseAccount<CandyMachine> {
  get size() {
    return getSpaceForCandy(this.data.data);
  }

  static getConfigLinesCount(rawData: Buffer) {
    return getConfigLinesCount(rawData);
  }

  static getConfigLines(rawData: Buffer) {
    return getConfigLines(rawData);
  }

  static assertName(name: string) {
    return assertName(name);
  }

  static assertSymbol(symbol: string) {
    return assertSymbol(symbol);
  }

  static assertUri(uri: string) {
    return assertUri(uri);
  }

  static assertCreators(creators: Creator[]) {
    assertCreators(creators);
  }

  static assertConfigLineConstraints({
    name,
    uri,
  }: {
    name: string;
    uri: string;
  }) {
    CandyMachineAccount.assertName(name);
    CandyMachineAccount.assertUri(uri);
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
