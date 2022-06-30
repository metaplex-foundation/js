import BN from 'bn.js';

// Auctioneer uses "u64::MAX" for the price which is "2^64 − 1".
export const AUCTIONEER_PRICE = new BN('18446744073709551615');
