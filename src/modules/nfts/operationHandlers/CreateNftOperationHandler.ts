import { Keypair, PublicKey } from '@solana/web3.js';
import { getMinimumBalanceForRentExemptMint, getAssociatedTokenAddress } from '@solana/spl-token';
import { MetadataAccount, MasterEditionAccount } from '@/programs/tokenMetadata';
import { Creator, DataV2 } from '@metaplex-foundation/mpl-token-metadata';
import { useOperationHandler } from '@/shared';
import { CreateNftInput, CreateNftOperation } from '../operations';
import { JsonMetadata } from '../models/JsonMetadata';
import { createNftBuilder } from '../transactionBuilders';
import { Metaplex } from '@/Metaplex';

export const createNftOperationHandler = useOperationHandler<CreateNftOperation>(
  async (metaplex: Metaplex, operation: CreateNftOperation) => {
    const {
      uri,
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
      confirmOptions,
    } = operation.input;

    const metadata: JsonMetadata = await metaplex.storage().downloadJson(uri);
    const data = resolveData(operation.input, metadata, updateAuthority.publicKey);

    const metadataPda = await MetadataAccount.pda(mint.publicKey);
    const masterEditionPda = await MasterEditionAccount.pda(mint.publicKey);
    const lamports = await getMinimumBalanceForRentExemptMint(metaplex.connection);
    const associatedToken = await getAssociatedTokenAddress(
      mint.publicKey,
      owner,
      allowHolderOffCurve,
      tokenProgram,
      associatedTokenProgram
    );

    const transactionId = await metaplex.sendAndConfirmTransaction(
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
      transactionId,
    };
  }
);

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
