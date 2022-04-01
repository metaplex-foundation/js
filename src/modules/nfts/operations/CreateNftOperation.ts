import { PublicKey } from '@solana/web3.js';
import { bignum } from '@metaplex-foundation/beet';
import { Creator, Collection, Uses } from '@metaplex-foundation/mpl-token-metadata';
import { Signer } from '@/utils';
import { JsonMetadata } from '../models/JsonMetadata';
import { Operation } from '@/modules/shared';

export class CreateNftOperation extends Operation<CreateNftInput, CreateNftOutput> {}

export interface CreateNftInput {
  // Data.
  name?: string;
  symbol?: string;
  uri?: string;
  metadata?: JsonMetadata;
  sellerFeeBasisPoints?: number;
  creators?: Creator[];
  collection?: Collection;
  uses?: Uses;
  isMutable?: boolean;
  maxSupply?: bignum;
  allowHolderOffCurve?: boolean;

  // Signers.
  mint?: Signer;
  payer?: Signer;
  mintAuthority?: Signer;
  updateAuthority?: Signer;

  // Public keys.
  owner?: PublicKey;
  freezeAuthority?: PublicKey;

  // Programs.
  tokenProgram?: PublicKey;
  associatedTokenProgram?: PublicKey;
}

export interface CreateNftOutput {
  mint: Signer;
  metadata: PublicKey;
  masterEdition: PublicKey;
  associatedToken: PublicKey;
  transactionId: string;
}
