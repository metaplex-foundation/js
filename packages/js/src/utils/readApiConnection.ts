// TODO(jon): Pretty sure this whole file should just be a separate package that gets packaged
// alongside the Read API instead

import { TokenStandard } from '@metaplex-foundation/mpl-token-metadata';
import { PROGRAM_ID as BUBBLEGUM_PROGRAM_ID } from '@metaplex-foundation/mpl-bubblegum';
import {
  Commitment,
  Connection,
  ConnectionConfig,
  PublicKey,
} from '@solana/web3.js';
import BN from 'bn.js';
import type { Metadata, Mint, NftOriginalEdition } from '@/plugins';
import type { SplTokenCurrency } from '@/types';
import { Pda, amount, toBigNumber } from '@/types';

type JsonRpcParams<ReadApiMethodParams> = {
  method: string;
  id?: string;
  params: ReadApiMethodParams;
};

type JsonRpcOutput<ReadApiJsonOutput> = {
  result: ReadApiJsonOutput;
};

export type GetAssetRpcInput = {
  id: string;
};

export type GetAssetRpcResponse = {
  id: string;
  interface: 'V1_NFT';
  content: {
    json_uri: string;
    metadata: Metadata['json'];
  };
  authorities: Array<{ address: string; scopes: ['full'] }>;
  mutable: boolean;
  royalty: {
    primary_sale_happened: boolean;
    basis_points: number;
  };
  supply: {
    edition_nonce: number;
    print_current_supply: number;
    print_max_supply: number;
  };
  creators: Metadata['creators'];
  grouping: Array<{ group_key: 'collection'; group_value: string }>;
  compression: {
    tree: string;
    leaf_id: number;
  };
};

type GetAssetProofRpcInput = {
  id: string;
};

export type GetAssetProofRpcResponse = {
  root: string;
  proof: string[];
  node_index: number;
  leaf: string;
  tree_id: string;
};

export const toNftEditionFromReadApiAsset = (
  input: GetAssetRpcResponse
): NftOriginalEdition => {
  return {
    model: 'nftEdition',
    isOriginal: true,
    address: new PublicKey(input.id),
    supply: toBigNumber(input.supply.print_current_supply),
    maxSupply: toBigNumber(input.supply.print_max_supply),
  };
};

export const toMintFromReadApiAsset = (input: GetAssetRpcResponse): Mint => {
  const currency: SplTokenCurrency = {
    symbol: 'Token',
    decimals: 0,
    namespace: 'spl-token',
  };

  return {
    model: 'mint',
    address: new PublicKey(input.id),
    // TODO(jon): Presumably, this should be the Master Edition address upon decompression
    mintAuthorityAddress: new PublicKey(input.id),
    // TODO(jon): Presumably, this should be the Master Edition address upon decompression
    freezeAuthorityAddress: new PublicKey(input.id),
    decimals: 0,
    supply: amount(1, currency),
    isWrappedSol: false,
    currency,
  };
};

export const toMetadataFromReadApiAsset = (
  input: GetAssetRpcResponse
): Metadata => {
  console.info({ input });

  const updateAuthority = input.authorities?.find((authority) =>
    authority.scopes.includes('full')
  );

  const collection = input.grouping.find(
    ({ group_key }) => group_key === 'collection'
  );

  return {
    model: 'metadata',
    // TODO(jon): We technically don't have a metadata address anymore. We can derive one though
    address: Pda.find(BUBBLEGUM_PROGRAM_ID, [
      Buffer.from('asset', 'utf-8'),
      new PublicKey(input.compression.tree).toBuffer(),
      Uint8Array.from(new BN(input.compression.leaf_id).toArray('le', 8)),
    ]),
    mintAddress: new PublicKey(input.id),
    updateAuthorityAddress: new PublicKey(updateAuthority!.address),

    name: input.content.metadata?.name ?? '',
    symbol: input.content.metadata?.symbol ?? '',

    json: input.content.metadata,
    jsonLoaded: true,
    uri: input.content.json_uri,
    isMutable: input.mutable,

    primarySaleHappened: input.royalty.primary_sale_happened,
    sellerFeeBasisPoints: input.royalty.basis_points,
    creators: input.creators,

    editionNonce: input.supply.edition_nonce,
    tokenStandard: TokenStandard.NonFungible,

    collection: collection
      ? { address: new PublicKey(collection.group_value), verified: false }
      : null,

    // TODO(jon): Read API doesn't return this info
    collectionDetails: null,
    // TODO(jon): Read API doesn't return this info
    uses: null,
  };
};

export class ReadApiConnection extends Connection {
  constructor(
    endpoint: string,
    commitmentOrConfig?: Commitment | ConnectionConfig
  ) {
    // TODO(jon): Take in an optional override for the Read API, or potentially adapters for other endpoints
    super(endpoint, commitmentOrConfig);
  }

  private callReadApi = async <ReadApiMethodParams, ReadApiJsonOutput>(
    jsonRpcParams: JsonRpcParams<ReadApiMethodParams>
  ): Promise<JsonRpcOutput<ReadApiJsonOutput>> => {
    const response = await fetch(this.rpcEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: jsonRpcParams.method,
        id: jsonRpcParams.id ?? 'rpd-op-123',
        params: jsonRpcParams.params,
      }),
    });

    return await response.json();
  };

  // Asset id can be calculated via Bubblegum#getLeafAssetId
  // It is a PDA with the following seeds: ["asset", tree, leafIndex]
  async getAsset(assetId: PublicKey): Promise<GetAssetRpcResponse> {
    const { result: asset } = await this.callReadApi<
      GetAssetRpcInput,
      GetAssetRpcResponse
    >({
      method: 'getAsset',
      params: {
        id: assetId.toBase58(),
      },
    });

    console.info({ asset });
    return asset;
  }

  // Asset id can be calculated via Bubblegum#getLeafAssetId
  // It is a PDA with the following seeds: ["asset", tree, leafIndex]
  async getAssetProof(assetId: PublicKey): Promise<GetAssetProofRpcResponse> {
    const { result: proof } = await this.callReadApi<
      GetAssetProofRpcInput,
      GetAssetProofRpcResponse
    >({
      method: 'getAssetProof',
      params: {
        id: assetId.toBase58(),
      },
    });

    console.info({ proof });

    return proof;
  }
}
