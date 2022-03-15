import { Keypair, PublicKey } from "@solana/web3.js";
import { getMinimumBalanceForRentExemptMint, getAssociatedTokenAddress } from "@solana/spl-token";
import { bignum } from "@metaplex-foundation/beet";
import { Metaplex } from "@/Metaplex";
import { createNftBuilder } from "../transactionBuilders";
import { MetadataAccount, MasterEditionAccount } from "@/programs/tokenMetadata";
import { Creator, Collection, Uses } from "@/programs/tokenMetadata/generated";
import { Signer } from "@/utils";
import { JsonMetadata } from "../models/JsonMetadata";
import { MetaplexFile } from "@/drivers/Filesystem/MetaplexFile";

export interface CreateNftParams {
  // Data.
  name: string;
  symbol?: string;
  uri?: string;
  json?: JsonMetadata;
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

  const resolvedUri = await getUri(metaplex, params);

  const data = {
    name,
    symbol,
    uri: resolvedUri,
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

  const transactionId = await metaplex.sendAndConfirmTransaction(createNftBuilder({
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

export const getUri = async (metaplex: Metaplex, params: CreateNftParams): Promise<string> => {
  if (params.uri) {
    return params.uri;
  }

  if (params.json) {
    return metaplex.storage().upload(new MetaplexFile(JSON.stringify(params.json)));
  }

  const json: JsonMetadata = {
    name: params.name,
    creators: params.creators,
    //
  };

  return metaplex.storage().upload(new MetaplexFile(JSON.stringify(json)));
};
