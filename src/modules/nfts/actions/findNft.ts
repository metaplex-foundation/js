import { PublicKey } from "@solana/web3.js";
import { Nft } from "@/modules/nfts";
import { MetadataAccount, MasterEditionAccount } from "@/programs/tokenMetadata";
import { Metaplex } from "@/Metaplex";

export interface FindNftParams {
  mint?: PublicKey,
}

export const findNft = async (metaplex: Metaplex, params: FindNftParams): Promise<Nft> => {
  if (params.mint) {
    return findNftFromMint(metaplex, params.mint);
  } else {
    // TODO: Custom error.
    throw new Error('Nft option not provided');
  }
}

export const findNftFromMint = async (metaplex: Metaplex, mint: PublicKey): Promise<Nft> => {
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
    // TODO: Custom error.
    throw new Error('Nft not found');
  }

  return new Nft(metadata, edition, await metadata.getJson());
}
