import { Keypair, PublicKey, Signer } from "@solana/web3.js";
import { getMinimumBalanceForRentExemptMint, getAssociatedTokenAddress } from "@solana/spl-token";
import { bignum } from "@metaplex-foundation/beet";
import { Metaplex } from "@/Metaplex";
import { MetadataAccount, MasterEditionAccount } from "@/programs";
import { DataV2 } from "@/programs/tokenMetadata/generated";
import { createNftBuilder } from "@/modules/nfts";

export interface CreateNftParams {
  // Data.
  data: DataV2;
  isMutable?: boolean;
  maxSupply?: bignum;
  allowHolderOffCurve?: boolean;

  // Signers.
  mint?: Signer;
  payer: Signer;
  mintAuthority: Signer;
  updateAuthority?: Signer;

  // Public keys.
  owner: PublicKey;
  freezeAuthority?: PublicKey;

   // Programs.
  tokenProgram?: PublicKey;
  associatedTokenProgram?: PublicKey;
}

export const createNft = async (metaplex: Metaplex, params: CreateNftParams): Promise<string> => {
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

  const tx = createNftBuilder({
    lamports,
    data,
    isMutable,
    maxSupply,
    createAssociatedToken: true,
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
  });

  const txId = await metaplex.sendTransaction(tx);

  // TODO: Return Nft object or should this live in the client?
  return txId;
}
