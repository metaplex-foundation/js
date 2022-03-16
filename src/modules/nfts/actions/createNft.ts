import { Keypair, PublicKey } from "@solana/web3.js";
import { getMinimumBalanceForRentExemptMint, getAssociatedTokenAddress } from "@solana/spl-token";
import { bignum } from "@metaplex-foundation/beet";
import { Metaplex } from "@/Metaplex";
import { createNftBuilder } from "../transactionBuilders";
import { MetadataAccount, MasterEditionAccount, DataV2 } from "@/programs/tokenMetadata";
import { Creator, Collection, Uses } from "@/programs/tokenMetadata/generated";
import { Signer } from "@/utils";
import { JsonMetadata } from "../models/JsonMetadata";

export interface CreateNftParams {
  // Data.
  name?: string;
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

  const [uri, json] = await resolveUriAndJson(metaplex, params);
  const data = resolveData(metaplex, params, uri, json);

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

const resolveUriAndJson = async (metaplex: Metaplex, params: CreateNftParams): Promise<[string, JsonMetadata]> => {
  if (params.uri) {
    const json: JsonMetadata = await metaplex.storage().downloadJson(params.uri);

    return [params.uri, json];
  }

  if (params.json) {
    const uri = await metaplex.storage().uploadJson(params.json);

    return [uri, params.json];
  }

  const json: JsonMetadata = {
    name: params.name,
    symbol: params.symbol,
    seller_fee_basis_points: params.sellerFeeBasisPoints,
    properties: {
      creators: params.creators?.map(creator => ({
        address: creator.address.toBase58(),
        share: creator.share,
      })),
    },
  };

  const uri = await metaplex.storage().uploadJson(json);

  return [uri, json];
};

const resolveData = (metaplex: Metaplex, params: CreateNftParams, uri: string, json: JsonMetadata): DataV2 => {
  const jsonCreators: Creator[] | undefined = json.properties?.creators
    ?.filter(creator => creator.address)
    .map(creator => ({
      address: new PublicKey(creator.address as string),
      share: creator.share ?? 0,
      verified: false,
    }));

  let creators = params.creators ?? jsonCreators ?? null;

  if (creators === null) {
    creators = [{
      address: metaplex.identity().publicKey,
      share: 100,
      verified: true,
    }]
  } else {
    creators = creators.map(creator => {
      if (creator.address.toBase58() === metaplex.identity().publicKey.toBase58()) {
        return { ...creator, verified: true };
      } else {
        return creator;
      }
    });
  }
  
  return {
    name: params.name ?? json.name ?? '',
    symbol: params.symbol ?? json.symbol ?? '',
    uri,
    sellerFeeBasisPoints: params.sellerFeeBasisPoints ?? json.seller_fee_basis_points ?? 500,
    creators,
    collection: params.collection ?? null,
    uses: params.uses ?? null,
  }
}
