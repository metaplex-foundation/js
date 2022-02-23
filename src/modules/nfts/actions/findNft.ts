import { PublicKey } from "@solana/web3.js";
import { Nft } from "@/modules/nfts";
import { MetadataAccount, MasterEditionAccount } from "@/modules/shared";
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
    metadataAccountInfo,
    editionAccountInfo,
  ] = await metaplex.getMultipleAccountsInfo(publicKeys);

  if (!metadataAccountInfo) {
    return null;
  }

  return new Nft(
    MetadataAccount.fromAccountInfo(metadataAccountInfo), 
    editionAccountInfo ? MasterEditionAccount.fromAccountInfo(editionAccountInfo) : null,
  );
}
