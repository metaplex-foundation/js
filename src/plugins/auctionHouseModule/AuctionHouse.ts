import type { PublicKey } from '@solana/web3.js';
import { AuctionHouseAccount } from '@/programs';
import { Model, Pda } from '@/types';
import { WRAPPED_SOL_MINT } from './constants';

export class AuctionHouse extends Model {
  public readonly address: Pda;
  public readonly creator: PublicKey;
  public readonly authority: PublicKey;
  public readonly treasuryMint: PublicKey;
  public readonly feeAccount: Pda;
  public readonly treasuryAccount: Pda;
  public readonly feeWithdrawalDestination: PublicKey;
  public readonly treasuryWithdrawalDestination: PublicKey;

  constructor(account: AuctionHouseAccount) {
    super();
    this.address = new Pda(account.publicKey, account.data.bump);
    this.creator = account.data.creator;
    this.authority = account.data.authority;
    this.treasuryMint = account.data.treasuryMint;
    this.feeAccount = new Pda(
      account.data.auctionHouseFeeAccount,
      account.data.feePayerBump
    );
    this.treasuryAccount = new Pda(
      account.data.auctionHouseTreasury,
      account.data.treasuryBump
    );
    this.feeWithdrawalDestination = account.data.feeWithdrawalDestination;
    this.treasuryWithdrawalDestination =
      account.data.treasuryWithdrawalDestination;
  }

  usesSol(): boolean {
    return this.treasuryMint.equals(WRAPPED_SOL_MINT);
  }
}
