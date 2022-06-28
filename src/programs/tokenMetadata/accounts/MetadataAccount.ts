import { Metadata } from '@metaplex-foundation/mpl-token-metadata';
import {
  Account,
  getAccountParsingAndAssertingFunction,
  getAccountParsingFunction,
} from '@/types';

export type MetadataAccount = Account<Metadata>;
export const parseMetadataAccount = getAccountParsingFunction(Metadata);
export const toMetadataAccount =
  getAccountParsingAndAssertingFunction(Metadata);
