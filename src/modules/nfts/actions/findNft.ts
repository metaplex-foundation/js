import { PublicKey } from "@solana/web3.js";
import { Nft } from "@/modules/nfts";
import { MetadataAccount, MasterEditionAccount } from "@/programs/tokenMetadata";
import { Metaplex } from "@/Metaplex";

export interface FindNftParams {
  mint?: PublicKey,
}

export const findNft = async (metaplex: Metaplex, params: FindNftParams): Promise<Nft | null> => {
  if (params.mint) {
    return findNftFromMint(metaplex, params.mint);
  } else {
    return null;
  }
}

export const findNftFromMint = async (metaplex: Metaplex, mint: PublicKey): Promise<Nft | null> => {
  const metadataPda = await MetadataAccount.pda(mint);
  const editionPda = await MasterEditionAccount.pda(mint);
  const publicKeys = [metadataPda, editionPda];

  const [
    metadataInfo,
    editionInfo,
  ] = await metaplex.getMultipleAccountsInfo(publicKeys);
  const metadata = metadataInfo ? MetadataAccount.fromAccountInfo(metadataInfo) : null;
  const edition = editionInfo ? MasterEditionAccount.fromAccountInfo(editionInfo) : null;

  if (!metadata) {
    return null;
  }

  return new Nft(metadata, edition, await metadata.getJson());
}
