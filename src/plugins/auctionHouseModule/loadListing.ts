import type { Commitment } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler, amount } from '@/types';
import { LazyListing, Listing } from './Listing';
import { findAssociatedTokenAccountPda, toMetadataAccount } from '@/programs';
import { makeMintModel, toMintAccount, toTokenAccount } from '../tokenModule';
import { makeMetadataModel, makeTokenWithMetadataModel } from '../nftModule';
import { JsonMetadata } from '../nftModule';
import { DisposableScope, Option, removeEmptyChars } from '@/utils';

// -----------------
// Operation
// -----------------

const Key = 'LoadListingOperation' as const;
export const loadListingOperation = useOperation<LoadListingOperation>(Key);
export type LoadListingOperation = Operation<
  typeof Key,
  LoadListingInput,
  Listing
>;

export type LoadListingInput = {
  lazyListing: LazyListing;
  loadJsonMetadata?: boolean; // Default: true
  commitment?: Commitment;
};

// -----------------
// Handler
// -----------------

export const loadListingOperationHandler: OperationHandler<LoadListingOperation> =
  {
    handle: async (
      operation: LoadListingOperation,
      metaplex: Metaplex,
      { signal }: DisposableScope
    ) => {
      // TODO(loris): This should be repurposed in a generic Token module.
      const {
        lazyListing,
        loadJsonMetadata = true,
        commitment,
      } = operation.input;

      // Metadata.
      const metadataAccount = toMetadataAccount(
        await metaplex.rpc().getAccount(lazyListing.metadataAddress, commitment)
      );

      let json: Option<JsonMetadata> | undefined = undefined;
      if (loadJsonMetadata) {
        json = await metaplex
          .storage()
          .downloadJson<JsonMetadata>(
            removeEmptyChars(metadataAccount.data.data.uri),
            { signal }
          );
      }

      const metadataModel = makeMetadataModel(metadataAccount, json);

      // Mint and token.
      const mintAddress = metadataModel.mintAddress;
      const tokenAddress = findAssociatedTokenAccountPda(
        mintAddress,
        lazyListing.sellerAddress
      );
      const unparsedAccounts = await metaplex
        .rpc()
        .getMultipleAccounts([mintAddress, tokenAddress], commitment);
      const mintAccount = toMintAccount(unparsedAccounts[0]);
      const tokenAccount = toTokenAccount(unparsedAccounts[1]);
      const mintModel = makeMintModel(mintAccount);

      const tokenModel = makeTokenWithMetadataModel(
        tokenAccount,
        mintModel,
        metadataModel,
        tokenAddress
      );

      return {
        ...lazyListing,
        model: 'listing',
        lazy: false,
        token: tokenModel,
        tokens: amount(lazyListing.tokens, tokenModel.mint.currency),
      };
    },
  };
