import { Keypair, PublicKey } from "@solana/web3.js";
import { getMinimumBalanceForRentExemptMint, getAssociatedTokenAddress } from "@solana/spl-token";
import { bignum } from "@metaplex-foundation/beet";
import { Metaplex } from "@/Metaplex";
import { createNftBuilder } from "@/modules/nfts";
import { MetadataAccount, MasterEditionAccount } from "@/programs/tokenMetadata";
import { Creator, Collection, Uses } from "@/programs/tokenMetadata/generated";
import { Signer } from "@/utils";

export interface CreateNftParams {
  // Data.
  name: string;
  symbol?: string;
  uri: string;
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

export interface CreateNftResult {
  mint: Signer,
  metadata: PublicKey,
  masterEdition: PublicKey,
  associatedToken: PublicKey,
  transactionId: string,
}

export const createNft = async (metaplex: Metaplex, params: CreateNftParams): Promise<CreateNftResult> => {
  const {
    name,
    symbol = '',
    uri,
    sellerFeeBasisPoints = 500,
    creators = null,
    collection = null,
    uses = null,
    isMutable,
    maxSupply,
    allowHolderOffCurve = false,
    mint = Keypair.generate(),
    payer = metaplex.identity(),
    mintAuthority = payer,
    updateAuthority = mintAuthority,
    owner = mintAuthority.publicKey,
    freezeAuthority,
    tokenProgram,
    associatedTokenProgram,
  } = params;

  const data = {
    name,
    symbol,
    uri,
    sellerFeeBasisPoints,
    creators,
    collection,
    uses,
  }

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
