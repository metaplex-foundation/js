import { Keypair } from '@solana/web3.js';
import { getMinimumBalanceForRentExemptMint, getAssociatedTokenAddress } from '@solana/spl-token';
import { MetadataAccount, MasterEditionAccount, EditionAccount } from '@/programs/tokenMetadata';
import { MintNewEditionOperation } from '../operations';
import { mintNewEditionBuilder } from '../transactionBuilders';
import { Metaplex } from '@/Metaplex';
import { OperationHandler } from '@/shared';
import BN from 'bn.js';
import { EditionMarkerAccount } from '@/programs/tokenMetadata/accounts/EditionMarkerAccount';

export const mintNewEditionOperationHandler: OperationHandler<MintNewEditionOperation> = {
  handle: async (operation: MintNewEditionOperation, metaplex: Metaplex) => {
    const {
      masterMint,
      newMint = Keypair.generate(),
      newMintAuthority = metaplex.identity(),
      newUpdateAuthority = newMintAuthority.publicKey,
      newOwner = newMintAuthority.publicKey,
      newFreezeAuthority,
      payer = metaplex.identity(),
      tokenProgram,
      associatedTokenProgram,
      confirmOptions,
    } = operation.input;

    // Master NFT.
    const masterMetadata = await MetadataAccount.pda(masterMint);
    const masterEdition = await MasterEditionAccount.pda(masterMint);
    const masterEditionInfo = await metaplex.rpc().getAccountInfo(masterEdition);

    if (!masterEditionInfo) {
      throw new Error();
    }

    const masterEditionAccount = MasterEditionAccount.fromAccountInfo(masterEditionInfo);
    const edition = new BN(masterEditionAccount.data.supply, 'le').add(new BN(1));
    const masterEditionMarkPda = await EditionMarkerAccount.pda(masterMint, edition);

    // New NFT.
    const newMetadata = await MetadataAccount.pda(newMint.publicKey);
    const newEdition = await EditionAccount.pda(newMint.publicKey);
    const lamports = await getMinimumBalanceForRentExemptMint(metaplex.connection);
    const newAssociatedToken = await getAssociatedTokenAddress(
      newMint.publicKey,
      newOwner,
      false,
      tokenProgram,
      associatedTokenProgram
    );

    const { signature } = await metaplex.rpc().sendAndConfirmTransaction(
      mintNewEditionBuilder({
        lamports,
        edition,
        newMint,
        newMetadata,
        newEdition,
        newMintAuthority,
        newUpdateAuthority,
        newOwner,
        newAssociatedToken,
        newFreezeAuthority,
        payer,
        masterMetadata,
        masterEdition,
        masterEditionMarkPda,
        tokenProgram,
        associatedTokenProgram,
      }),
      undefined,
      confirmOptions
    );

    return {
      mint: newMint,
      metadata: newMetadata,
      edition: newEdition,
      associatedToken: newAssociatedToken,
      transactionId: signature,
    };
  },
};
