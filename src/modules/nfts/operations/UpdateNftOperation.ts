import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { Collection, Creator, Uses } from '@metaplex-foundation/mpl-token-metadata';
import { Operation, Signer } from '@/shared/index';
import { Nft } from '../models/index';

export class UpdateNftOperation extends Operation<UpdateNftInput, UpdateNftOutput> {}

export interface UpdateNftInput {
  nft: Nft;

  // Data.
  name?: string;
  symbol?: string;
  uri?: string;
  sellerFeeBasisPoints?: number;
  creators?: Creator[];
  collection?: Collection;
  uses?: Uses;
  newUpdateAuthority?: PublicKey;
  primarySaleHappened?: boolean;
  isMutable?: boolean;

  // Signers.
  updateAuthority?: Signer;

  // Options.
  confirmOptions?: ConfirmOptions;
}

export interface UpdateNftOutput {
  transactionId: string;
}
