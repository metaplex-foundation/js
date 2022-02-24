import { Keypair, PublicKey, Signer } from "@solana/web3.js";
import { bignum } from "@metaplex-foundation/beet";
import { Metaplex } from "@/Metaplex";
import { getMinimumBalanceForRentExemptMint, getAssociatedTokenAddress } from "@solana/spl-token";
import { TransactionBuilder, MetadataAccount, MasterEditionAccount } from "@/programs";
import { DataV2 } from "@/programs/tokenMetadata/generated";
import { createMintBuilder, createAssociatedTokenAccountBuilder, mintToBuilder, disableMintingBuilder } from "@/programs/token";
import { createMetadataV2Builder, createMasterEditionV3Builder } from "@/programs/tokenMetadata";

export interface CreateNftParams {
  data: DataV2,
  isMutable?: boolean,
  maxSupply?: bignum,
  decimals?: number;
  allowHolderOffCurve?: boolean;
  mint?: Signer;
  payer: Signer;
  mintAuthority: Signer;
  updateAuthority?: Signer;
  holder: PublicKey;
  freezeAuthority?: PublicKey;
  tokenProgram?: PublicKey;
  associatedTokenProgram?: PublicKey;
}

export const createNft = async (metaplex: Metaplex, params: CreateNftParams): Promise<string> => {
  const tx = await createNftBuilder(metaplex, params);
  const txId = await metaplex.sendTransaction(tx);

  // TODO: Return Nft object or should this live in the client?
  return txId;
}

export const createNftBuilder = async (metaplex: Metaplex, params: CreateNftParams): Promise<TransactionBuilder> => {
  const {
    // Data.
    data,
    isMutable = false,
    maxSupply,
    decimals = 0,
    allowHolderOffCurve = false,

    // Signers.
    mint = Keypair.generate(),
    payer,
    mintAuthority,
    updateAuthority = mintAuthority,

    // PublicKeys.
    holder,
    freezeAuthority,

    // Programs.
    tokenProgram,
    associatedTokenProgram,
  } = params;

  const tx = new TransactionBuilder();
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

  // Create and initialize the mint account.
  tx.add(createMintBuilder({
    lamports,
    decimals,
    mint,
    payer,
    mintAuthority: mintAuthority.publicKey,
    freezeAuthority,
    tokenProgram,
  }));

  // Create the holder associated account if it does not exists.
  if (!holderTokenExists) {
    tx.add(createAssociatedTokenAccountBuilder({
      payer,
      associatedToken: holderToken,
      owner: holder,
      mint: mint.publicKey,
      tokenProgram,
      associatedTokenProgram,
    }));
  }

  // Mint 1 token to the token holder.
  tx.add(mintToBuilder({
    mint: mint.publicKey,
    destination: holderToken,
    mintAuthority,
    amount: 1,
    tokenProgram,
  }));

  // Create metadata account.
  tx.add(createMetadataV2Builder({
    data,
    isMutable,
    mintAuthority,
    payer,
    mint: mint.publicKey,
    metadata,
    updateAuthority: updateAuthority.publicKey,
  }));

  // Create master edition account.
  tx.add(createMasterEditionV3Builder({
    maxSupply,
    payer,
    mintAuthority,
    updateAuthority,
    mint: mint.publicKey,
    metadata,
    masterEdition,
  }));

  // Prevent further minting.
  tx.add(disableMintingBuilder({
    mint: mint.publicKey,
    mintAuthority,
    tokenProgram,
  }));

  return tx;
}
