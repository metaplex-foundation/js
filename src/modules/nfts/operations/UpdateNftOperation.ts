import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { Collection, Creator, Uses } from '@metaplex-foundation/mpl-token-metadata';
import { useOperation, Signer } from '@/shared';
import { Nft } from '../models';

export const updateNftOperation = useOperation<UpdateNftInput, UpdateNftOutput>(
  'updateNftOperation'
);

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
