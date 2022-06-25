import { PublicKey } from '@solana/web3.js';
import { BN } from 'bn.js';

export const WRAPPED_SOL_MINT = new PublicKey(
  'So11111111111111111111111111111111111111112'
);

// Auctioneer uses "u64::MAX" for the price which is "2^64 − 1".
export const AUCTIONEER_PRICE = new BN('18446744073709551615');
