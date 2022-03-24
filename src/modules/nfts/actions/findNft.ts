import { PublicKey } from '@solana/web3.js';
import { JsonMetadata, Nft } from '../models';
import { MetadataAccount, MasterEditionAccount } from '@/programs/tokenMetadata';
import { Metaplex } from '@/Metaplex';
import { removeEmptyChars } from '@/utils';

export interface FindNftParams {
  mint?: PublicKey;
}

export const findNft = async (metaplex: Metaplex, params: FindNftParams): Promise<Nft> => {
  if (params.mint) {
    return findNftFromMint(metaplex, params.mint);
  } else {
    // TODO: Custom error.
    throw new Error('Nft option not provided');
  }
};

export const findNftFromMint = async (metaplex: Metaplex, mint: PublicKey): Promise<Nft> => {
  const metadataPda = await MetadataAccount.pda(mint);
  const editionPda = await MasterEditionAccount.pda(mint);
  const publicKeys = [metadataPda, editionPda];

  const [metadataInfo, editionInfo] = await metaplex.getMultipleAccountsInfo(publicKeys);
  const metadataAccount = metadataInfo ? MetadataAccount.fromAccountInfo(metadataInfo) : null;
  const masterEditionAccount = editionInfo ? MasterEditionAccount.fromAccountInfo(editionInfo) : null;

  if (!metadataAccount) {
    // TODO: Custom error.
    throw new Error('Nft not found');
  }

  return new Nft(
    metadataAccount,
    masterEditionAccount,
    await fetchJsonMetadata(metaplex, metadataAccount)
  );
};

const fetchJsonMetadata = async (
  metaplex: Metaplex,
  metadata: MetadataAccount
): Promise<JsonMetadata | null> => {
  try {
    const uri = removeEmptyChars(metadata.data.data.uri);

    return metaplex.storage().downloadJson<JsonMetadata>(uri);
  } catch (error) {
    return null;
  }
};
