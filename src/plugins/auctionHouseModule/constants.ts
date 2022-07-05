import { toBigNumber } from '@/types';

// Auctioneer uses "u64::MAX" for the price which is "2^64 − 1".
export const AUCTIONEER_PRICE = toBigNumber('18446744073709551615');
