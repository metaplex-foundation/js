import { Keypair, PublicKey, Signer } from "@solana/web3.js";
import { getMinimumBalanceForRentExemptMint, getAssociatedTokenAddress } from "@solana/spl-token";
import { bignum } from "@metaplex-foundation/beet";
import { Metaplex } from "@/Metaplex";
import { createNftBuilder } from "@/modules/nfts";
import { MetadataAccount, MasterEditionAccount } from "@/programs/tokenMetadata";
import { DataV2 } from "@/programs/tokenMetadata/generated";

export interface CreateNftParams {
  // Data.
  data: DataV2;
  isMutable?: boolean;
  maxSupply?: bignum;
  allowHolderOffCurve?: boolean;

  // Signers.
  mint?: Signer;
  payer: Signer; // TODO: Make optional and use Identity driver when not provided.
  mintAuthority: Signer;
  updateAuthority?: Signer;

  // Public keys.
  owner: PublicKey;
  freezeAuthority?: PublicKey;

   // Programs.
  tokenProgram?: PublicKey;
  associatedTokenProgram?: PublicKey;
}

export interface CreateNftResult {
  mint: Signer,
  metadata: PublicKey,
  masterEdition: PublicKey,
  associatedToken: PublicKey,
  transactionId: string,
}

export const createNft = async (metaplex: Metaplex, params: CreateNftParams): Promise<CreateNftResult> => {
  const {
    data,
    isMutable,
    maxSupply,
    allowHolderOffCurve = false,
    mint = Keypair.generate(),
    payer,
    mintAuthority,
    updateAuthority = mintAuthority,
    owner = mintAuthority.publicKey,
    freezeAuthority,
    tokenProgram,
    associatedTokenProgram,
  } = params;

  const metadata = await MetadataAccount.pda(mint.publicKey);
  const masterEdition = await MasterEditionAccount.pda(mint.publicKey);
  const lamports = await getMinimumBalanceForRentExemptMint(metaplex.connection);
  const associatedToken = await getAssociatedTokenAddress(
    mint.publicKey,
    owner,
    allowHolderOffCurve,
    tokenProgram,
    associatedTokenProgram,
  );

  const transactionId = await metaplex.sendTransaction(createNftBuilder({
    lamports,
    data,
    isMutable,
    maxSupply,
    mint,
    payer,
    mintAuthority,
    updateAuthority,
    owner,
    associatedToken,
    freezeAuthority,
    metadata,
    masterEdition,
    tokenProgram,
    associatedTokenProgram,
  }));

  return {
    transactionId,
    mint,
    metadata,
    masterEdition,
    associatedToken,
  };
}
