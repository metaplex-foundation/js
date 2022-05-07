import { PublicKey } from '@solana/web3.js';
import { assert } from '@/utils';

/**
 * Synonym for `string` to differentiate strings that should contain a base58 representation of
 * a {@link PublicKey}
 *
 * @private
 */
export type PublicKeyString = string;

/**
 * Checks if a string is valid base58 Solana via a Regex.
 * @private
 */
export function isValidSolanaAddress(address: string) {
  return /^[0-9a-zA-Z]{43,88}$/.test(address);
}

/**
 * Checks if a string is valid PublicKey address.
 * @private
 */
export function isValidPublicKeyAddress(address: string) {
  if (!isValidSolanaAddress(address) || address.length > 44) return false;
  try {
    new PublicKey(address);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Checks if the {@link value} is valid base58 string for a PublicKey of a Solana Account.
 * @private
 */
export function isPublicKeyString(value: string): value is PublicKeyString {
  return typeof value === 'string' && isValidPublicKeyAddress(value);
}

/**
 * Tries to convert the {@link value} to a PublicKey.
 *
 * @throws {@link AssertionError} if the {@link value} is not a valid base58 string for a PublicKey of a Solana
 * Account.
 * @private
 * @throws if value is not a valid PublicKey address
 */
export function convertToPublickKey(value: PublicKeyString): PublicKey {
  assert(isPublicKeyString(value), `${value} is not a valid PublicKey`);
  return new PublicKey(value);
}
