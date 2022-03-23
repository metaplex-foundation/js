import { Metaplex } from '@/Metaplex';
import { DataV2, MetadataAccount } from '@/programs/tokenMetadata';
import { Collection, Creator, Uses } from '@/programs/tokenMetadata/generated';
import { Signer } from '@/utils';
import { PublicKey } from '@solana/web3.js';
import { Nft } from './../models/Nft';
import { updateNftBuilder } from './../transactionBuilders';
import { findNftFromMint } from './findNft';

export interface UpdateNftParams {
  mint: PublicKey;

  // Data.
  name: string;
  symbol: string;
  uri: string;
  sellerFeeBasisPoints: number;
  creators: Creator[];
  collection: Collection;
  uses: Uses;
  newUpdateAuthority?: PublicKey;
  primarySaleHappened?: boolean;
  isMutable?: boolean;

  // Signers.
  updateAuthority?: Signer;
}

export interface UpdateNftResult {
  transactionId: string;
}

export const updateNft = async (
  metaplex: Metaplex,
  params: UpdateNftParams
): Promise<UpdateNftResult> => {
  const { mint } = params;
  const nft = await findNftFromMint(metaplex, mint);

  const {
    newUpdateAuthority = nft.updateAuthority,
    primarySaleHappened = nft.primarySaleHappened,
    isMutable = nft.isMutable,
    updateAuthority = metaplex.identity(),
  } = params;

  const data = resolveData(params, nft);

  const metadata = await MetadataAccount.pda(mint);

  const transactionId = await metaplex.sendAndConfirmTransaction(
    updateNftBuilder({
      data,
      newUpdateAuthority,
      primarySaleHappened,
      isMutable,
      updateAuthority,
      metadata,
    })
  );
  return { transactionId };
};

const resolveData = (params: UpdateNftParams, nft: Nft): DataV2 => {
  return {
    name: params.name ?? nft.name,
    symbol: params.symbol ?? nft.symbol,
    uri: params.uri ?? nft.uri,
    sellerFeeBasisPoints:
      params.sellerFeeBasisPoints ?? nft.sellerFeeBasisPoints,
    creators: params.creators ?? nft.creators,
    collection: params.collection ?? nft.collection,
    uses: params.uses ?? nft.uses,
  };
};
