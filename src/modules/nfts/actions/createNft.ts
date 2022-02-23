import { Keypair, PublicKey, Signer, SystemProgram } from "@solana/web3.js";
import { Nft } from "@/modules/nfts";
import { MetadataAccount, MasterEditionAccount } from "@/modules/shared";
import { Metaplex } from "@/Metaplex";
import { MINT_SIZE, TOKEN_PROGRAM_ID, createInitializeMintInstruction, getMinimumBalanceForRentExemptMint } from "@solana/spl-token";
import { TransactionBuilder } from "@/utils";

export interface CreateNftParams {
  decimals: number,
  mint?: Signer,
  payer: Signer,
  mintAuthority: PublicKey,
  freezeAuthority?: PublicKey,
  tokenProgram?: PublicKey,
}

export const createNft = async (metaplex: Metaplex, params: CreateNftParams): Promise<string> => {
  const tx = await createNftBuilder(metaplex, params);
  const txId = await metaplex.sendTransaction(tx);

  // TODO: Return Nft object or should this live in the client?
  return txId;
}

export const createNftBuilder = async (metaplex: Metaplex, params: CreateNftParams): Promise<TransactionBuilder> => {
  const {
    decimals = 0,
    mint = Keypair.generate(),
    payer,
    mintAuthority,
    freezeAuthority = null,
    tokenProgram = TOKEN_PROGRAM_ID,
  } = params;

  const lamports = await getMinimumBalanceForRentExemptMint(metaplex.connection);

  const createAccountIx = SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: mint.publicKey,
    space: MINT_SIZE,
    lamports,
    programId: tokenProgram,
  });

  const initializeMintIx = createInitializeMintInstruction(
    mint.publicKey,
    decimals,
    mintAuthority,
    freezeAuthority,
    tokenProgram,
  );

  return (new TransactionBuilder())
    .add(createAccountIx, [payer, mint], 'createAccount')
    .add(initializeMintIx, [mint], 'initializeMint')
}
