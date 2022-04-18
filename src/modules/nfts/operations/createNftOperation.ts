import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { bignum } from '@metaplex-foundation/beet';
import { Creator, Collection, Uses } from '@metaplex-foundation/mpl-token-metadata';
import { useOperation, Signer, Operation } from '@/shared';

export const createNftOperation = useOperation<CreateNftOperation>('CreateNftOperation');

export type CreateNftOperation = Operation<'CreateNftOperation', CreateNftInput, CreateNftOutput>;

export interface CreateNftInput {
  // Data.
  uri: string;
  name?: string;
  symbol?: string;
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

  // Options.
  confirmOptions?: ConfirmOptions;
}

export interface CreateNftOutput {
  mint: Signer;
  metadata: PublicKey;
  masterEdition: PublicKey;
  associatedToken: PublicKey;
  transactionId: string;
}
