import { Keypair } from '@solana/web3.js';
import { getMinimumBalanceForRentExemptMint, getAssociatedTokenAddress } from '@solana/spl-token';
import BN from 'bn.js';
import {
  MetadataAccount,
  OriginalEditionAccount,
  PrintEditionAccount,
  EditionMarkerAccount,
} from '@/programs/tokenMetadata';
import { PrintNewEditionOperation } from '../operations';
import { printNewEditionBuilder } from '../transactionBuilders';
import { Metaplex } from '@/Metaplex';
import { OperationHandler, TransactionBuilder } from '@/shared';
import { AccountNotFoundError } from '@/errors';

export const printNewEditionOperationHandler: OperationHandler<PrintNewEditionOperation> = {
  handle: async (operation: PrintNewEditionOperation, metaplex: Metaplex) => {
    const {
      originalMint,
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

    // Original NFT.
    const originalMetadata = await MetadataAccount.pda(originalMint);
    const originalEdition = await OriginalEditionAccount.pda(originalMint);
    const originalEditionAccount = OriginalEditionAccount.fromMaybe(
      await metaplex.rpc().getAccount(originalEdition)
    );

    if (!originalEditionAccount.exists) {
      throw new AccountNotFoundError(
        originalEdition,
        'OriginalEdition',
        `Ensure the provided mint address for the original NFT [${originalMint.toBase58()}] ` +
          `is correct and that it has an associated OriginalEdition PDA.`
      );
    }

    const edition = new BN(originalEditionAccount.data.supply, 'le').add(new BN(1));
    const originalEditionMarkPda = await EditionMarkerAccount.pda(originalMint, edition);

    // New NFT.
    const newMetadata = await MetadataAccount.pda(newMint.publicKey);
    const newEdition = await PrintEditionAccount.pda(newMint.publicKey);
    const lamports = await getMinimumBalanceForRentExemptMint(metaplex.connection);
    const newAssociatedToken = await getAssociatedTokenAddress(
      newMint.publicKey,
      newOwner,
      false,
      tokenProgram,
      associatedTokenProgram
    );

    const sharedInput = {
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
      originalMetadata,
      originalEdition,
      originalEditionMarkPda,
      tokenProgram,
      associatedTokenProgram,
    };

    let transactionBuilder: TransactionBuilder;
    if (operation.input.via === 'vault') {
      transactionBuilder = printNewEditionBuilder({
        via: 'vault',
        vaultAuthority: operation.input.vaultAuthority,
        safetyDepositStore: operation.input.safetyDepositStore,
        safetyDepositBox: operation.input.safetyDepositBox,
        vault: operation.input.vault,
        tokenVaultProgram: operation.input.tokenVaultProgram,
        ...sharedInput,
      });
    } else {
      const originalTokenAccountOwner =
        operation.input.originalTokenAccountOwner ?? metaplex.identity();
      const originalTokenAccount =
        operation.input.originalTokenAccount ??
        (await getAssociatedTokenAddress(
          originalMint,
          originalTokenAccountOwner.publicKey,
          false,
          tokenProgram,
          associatedTokenProgram
        ));

      transactionBuilder = printNewEditionBuilder({
        via: 'token',
        originalTokenAccountOwner,
        originalTokenAccount,
        ...sharedInput,
      });
    }

    const { signature } = await metaplex
      .rpc()
      .sendAndConfirmTransaction(transactionBuilder, undefined, confirmOptions);

    return {
      mint: newMint,
      metadata: newMetadata,
      edition: newEdition,
      associatedToken: newAssociatedToken,
      transactionId: signature,
    };
  },
};
