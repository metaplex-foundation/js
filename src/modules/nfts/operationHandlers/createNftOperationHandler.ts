import { Keypair, PublicKey } from '@solana/web3.js';
import { getMinimumBalanceForRentExemptMint, getAssociatedTokenAddress } from '@solana/spl-token';
import { MetadataAccount, OriginalEditionAccount } from '@/programs/tokenMetadata';
import { Creator, DataV2 } from '@metaplex-foundation/mpl-token-metadata';
import { CreateNftInput, CreateNftOperation } from '../operations';
import { JsonMetadata } from '../models/JsonMetadata';
import { createNftBuilder } from '../transactionBuilders';
import { Metaplex } from '@/Metaplex';
import { OperationHandler } from '@/shared';

export const createNftOperationHandler: OperationHandler<CreateNftOperation> = {
  handle: async (operation: CreateNftOperation, metaplex: Metaplex) => {
    const {
      uri,
      isMutable,
      maxSupply,
      allowHolderOffCurve = false,
      mint = Keypair.generate(),
      payer = metaplex.identity(),
      mintAuthority = metaplex.identity(),
      updateAuthority = mintAuthority,
      owner = mintAuthority.publicKey,
      freezeAuthority,
      tokenProgram,
      associatedTokenProgram,
      confirmOptions,
    } = operation.input;

    let metadata: JsonMetadata;
    try {
      metadata = await metaplex.storage().downloadJson(uri);
    } catch (e) {
      metadata = {};
    }

    const data = resolveData(operation.input, metadata, updateAuthority.publicKey);

    const metadataPda = await MetadataAccount.pda(mint.publicKey);
    const masterEditionPda = await OriginalEditionAccount.pda(mint.publicKey);
    const lamports = await getMinimumBalanceForRentExemptMint(metaplex.connection);
    const associatedToken = await getAssociatedTokenAddress(
      mint.publicKey,
      owner,
      allowHolderOffCurve,
      tokenProgram,
      associatedTokenProgram
    );

    const { signature } = await metaplex.rpc().sendAndConfirmTransaction(
      createNftBuilder({
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
        metadata: metadataPda,
        masterEdition: masterEditionPda,
        tokenProgram,
        associatedTokenProgram,
      }),
      undefined,
      confirmOptions
    );

    return {
      mint,
      metadata: metadataPda,
      masterEdition: masterEditionPda,
      associatedToken,
      transactionId: signature,
    };
  },
};

const resolveData = (
  input: CreateNftInput,
  metadata: JsonMetadata,
  updateAuthority: PublicKey
): DataV2 => {
  const metadataCreators: Creator[] | undefined = metadata.properties?.creators
    ?.filter((creator) => creator.address)
    .map((creator) => ({
      address: new PublicKey(creator.address as string),
      share: creator.share ?? 0,
      verified: false,
    }));

  let creators = input.creators ?? metadataCreators ?? null;

  if (creators === null) {
    creators = [
      {
        address: updateAuthority,
        share: 100,
        verified: true,
      },
    ];
  } else {
    creators = creators.map((creator) => {
      if (creator.address.toBase58() === updateAuthority.toBase58()) {
        return { ...creator, verified: true };
      } else {
        return creator;
      }
    });
  }

  return {
    name: input.name ?? metadata.name ?? '',
    symbol: input.symbol ?? metadata.symbol ?? '',
    uri: input.uri,
    sellerFeeBasisPoints: input.sellerFeeBasisPoints ?? metadata.seller_fee_basis_points ?? 500,
    creators,
    collection: input.collection ?? null,
    uses: input.uses ?? null,
  };
};
