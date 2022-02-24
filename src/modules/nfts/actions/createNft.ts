import { Keypair, PublicKey, Signer } from "@solana/web3.js";
import { bignum } from "@metaplex-foundation/beet";
import { Metaplex } from "@/Metaplex";
import { getMinimumBalanceForRentExemptMint, getAssociatedTokenAddress } from "@solana/spl-token";
import { TransactionBuilder, MetadataAccount, MasterEditionAccount } from "@/programs";
import { DataV2 } from "@/programs/tokenMetadata/generated";
import { createMintAndMintToAssociatedTokenBuilder, disableMintingBuilder } from "@/programs/token";
import { createMetadataV2Builder, createMasterEditionV3Builder } from "@/programs/tokenMetadata";

export interface CreateNftParams {
  //
}

export interface CreateNftBuilderParams {
  // Data.
  data: DataV2,
  isMutable?: boolean,
  maxSupply?: bignum,
  allowHolderOffCurve?: boolean;

  // Signers.
  mint?: Signer;
  payer: Signer;
  mintAuthority: Signer;
  updateAuthority?: Signer;

  // Public keys.
  holder: PublicKey;
  freezeAuthority?: PublicKey;

   // Programs.
  tokenProgram?: PublicKey;
  associatedTokenProgram?: PublicKey;

  // Instruction keys.
  createAccountInstructionKey?: string,
  initializeMintInstructionKey?: string,
  createAssociatedTokenInstructionKey?: string,
  mintToInstructionKey?: string,
  createMetadataInstructionKey?: string,
  createMasterEditionInstructionKey?: string,
  disableMintingInstructionKey?: string,
}

export const createNft = async (metaplex: Metaplex, params: CreateNftParams): Promise<string> => {
  const tx = await createNftBuilder(metaplex, params);
  const txId = await metaplex.sendTransaction(tx);

  // TODO: Return Nft object or should this live in the client?
  return txId;
}

export const createNftBuilder = async (metaplex: Metaplex, params: CreateNftBuilderParams): Promise<TransactionBuilder> => {
  const {
    data,
    isMutable = false,
    maxSupply,
    allowHolderOffCurve = false,
    mint = Keypair.generate(),
    payer,
    mintAuthority,
    updateAuthority = mintAuthority,
    holder,
    freezeAuthority,
    tokenProgram,
    associatedTokenProgram,
    createAccountInstructionKey,
    initializeMintInstructionKey,
    createAssociatedTokenInstructionKey,
    mintToInstructionKey,
    createMetadataInstructionKey,
    createMasterEditionInstructionKey,
    disableMintingInstructionKey,
  } = params;

  const lamports = await getMinimumBalanceForRentExemptMint(metaplex.connection);
  const holderToken = await getAssociatedTokenAddress(
    mint.publicKey,
    holder,
    allowHolderOffCurve,
    tokenProgram,
    associatedTokenProgram,
  );
  const holderTokenExists = !! await metaplex.getAccountInfo(holderToken);
  const metadata = await MetadataAccount.pda(mint.publicKey);
  const masterEdition = await MasterEditionAccount.pda(mint.publicKey);

  return TransactionBuilder.make()

    // Create the mint account and send one token to the holder.
    .add(createMintAndMintToAssociatedTokenBuilder({
      lamports,
      decimals: 0,
      amount: 1,
      createAssociatedToken: !holderTokenExists,
      mint,
      payer,
      mintAuthority,
      owner: holder,
      associatedToken: holderToken,
      freezeAuthority,
      tokenProgram,
      associatedTokenProgram,
      createAccountInstructionKey,
      initializeMintInstructionKey,
      createAssociatedTokenInstructionKey,
      mintToInstructionKey,
    }))

    // Create metadata account.
    .add(createMetadataV2Builder({
      data,
      isMutable,
      mintAuthority,
      payer,
      mint: mint.publicKey,
      metadata,
      updateAuthority: updateAuthority.publicKey,
      instructionKey: createMetadataInstructionKey,
    }))

    // Create master edition account.
    .add(createMasterEditionV3Builder({
      maxSupply,
      payer,
      mintAuthority,
      updateAuthority,
      mint: mint.publicKey,
      metadata,
      masterEdition,
      instructionKey: createMasterEditionInstructionKey,
    }))

    // Prevent further minting.
    .add(disableMintingBuilder({
      mint: mint.publicKey,
      mintAuthority,
      tokenProgram,
      instructionKey: disableMintingInstructionKey,
    }));
}
