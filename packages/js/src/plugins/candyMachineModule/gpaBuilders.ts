import { GpaBuilder } from '@/utils';
import { PublicKey } from '@solana/web3.js';

type AccountDiscriminator = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
];
// TODO(thlorenz): copied from candy machine SDK
// SDK should either provide a GPA builder or expose this discriminator
const candyMachineDiscriminator: AccountDiscriminator = [
  51, 173, 177, 113, 25, 241, 109, 189,
];

const AUTHORITY = candyMachineDiscriminator.length;
const WALLET = AUTHORITY + PublicKey.default.toBytes().byteLength;

export class CandyMachineGpaBuilder extends GpaBuilder {
  whereDiscriminator(discrimator: AccountDiscriminator) {
    return this.where(0, Buffer.from(discrimator));
  }

  candyMachineAccounts() {
    return this.whereDiscriminator(candyMachineDiscriminator);
  }

  // wallet same as solTreasury
  candyMachineAccountsForWallet(wallet: PublicKey) {
    return this.candyMachineAccounts().where(WALLET, wallet.toBase58());
  }

  candyMachineAccountsForAuthority(authority: PublicKey) {
    return this.candyMachineAccounts().where(AUTHORITY, authority.toBase58());
  }
}
