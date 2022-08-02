import type { Metaplex } from '@/Metaplex';
import { token } from '@/types';
import { Task } from '@/utils';
import { PublicKey } from '@solana/web3.js';
import { SendTokensInput, SendTokensOutput } from '../tokenModule';
import { _createNftClient } from './createNft';
import { _createSftClient } from './createSft';
import { _findNftByMetadataClient } from './findNftByMetadata';
import { _findNftByMintClient, _refreshNftClient } from './findNftByMint';
import { _findNftByTokenClient } from './findNftByToken';
import { _findNftsByCreatorsClient } from './findNftsByCreator';
import { _findNftsByMintListClient } from './findNftsByMintList';
import { _findNftsByOwnerClient } from './findNftsByOwner';
import { _findNftsByUpdateAuthorityClient } from './findNftsByUpdateAuthority';
import { HasMintAddress, toMintAddress } from './helpers';
import { _loadMetadataClient } from './loadMetadata';
import { assertNftWithToken, Nft, NftWithToken } from './Nft';
import { NftBuildersClient } from './NftBuildersClient';
import {
  printNewEditionOperation,
  PrintNewEditionOutput,
  PrintNewEditionSharedInput,
  PrintNewEditionViaInput,
} from './printNewEdition';
import { Sft, SftWithToken } from './Sft';
import {
  UpdateNftInput,
  updateNftOperation,
  UpdateNftOutput,
} from './updateNft';
import {
  UploadMetadataInput,
  uploadMetadataOperation,
  UploadMetadataOutput,
} from './uploadMetadata';
import { UseNftInput, useNftOperation, UseNftOutput } from './useNft';

export class NftClient {
  constructor(protected readonly metaplex: Metaplex) {}

  builders() {
    return new NftBuildersClient(this.metaplex);
  }

  create = _createNftClient;
  createSft = _createSftClient;

  // Queries.
  findByMint = _findNftByMintClient;
  findByMetadata = _findNftByMetadataClient;
  findByToken = _findNftByTokenClient;
  findAllByCreator = _findNftsByCreatorsClient;
  findAllByMintList = _findNftsByMintListClient;
  findAllByOwner = _findNftsByOwnerClient;
  findAllByUpdateAuthority = _findNftsByUpdateAuthorityClient;
  refresh = _refreshNftClient;
  load = _loadMetadataClient;

  printNewEdition(
    originalNft: HasMintAddress,
    input: Omit<PrintNewEditionSharedInput, 'originalMint'> &
      PrintNewEditionViaInput = {}
  ): Task<PrintNewEditionOutput & { nft: NftWithToken }> {
    return new Task(async (scope) => {
      const originalMint = toMintAddress(originalNft);
      const operation = printNewEditionOperation({ originalMint, ...input });
      const output = await this.metaplex.operations().execute(operation, scope);
      scope.throwIfCanceled();
      const nft = await this.findByMint(output.mintSigner.publicKey, {
        tokenAddress: output.tokenAddress,
      }).run(scope);
      assertNftWithToken(nft);
      return { ...output, nft };
    });
  }

  send(
    nftOrSft: HasMintAddress,
    newOwner: PublicKey,
    options?: Omit<SendTokensInput, 'toOwner' | 'toToken'>
  ): Task<SendTokensOutput> {
    return this.metaplex.tokens().send({
      mint: toMintAddress(nftOrSft),
      toOwner: newOwner,
      amount: token(1),
      ...options,
    });
  }

  uploadMetadata(input: UploadMetadataInput): Task<UploadMetadataOutput> {
    return this.metaplex.operations().getTask(uploadMetadataOperation(input));
  }

  update(
    nftOrSft: Nft | Sft | NftWithToken | SftWithToken,
    input: Omit<UpdateNftInput, 'nftOrSft'>
  ): Task<UpdateNftOutput> {
    return this.metaplex
      .operations()
      .getTask(updateNftOperation({ ...input, nftOrSft }));
  }

  use(
    nft: HasMintAddress,
    input: Omit<UseNftInput, 'mintAddress'> = {}
  ): Task<UseNftOutput> {
    return this.metaplex
      .operations()
      .getTask(useNftOperation({ ...input, mintAddress: toMintAddress(nft) }));
  }
}
