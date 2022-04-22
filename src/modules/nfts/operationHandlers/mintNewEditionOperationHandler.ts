import { Keypair } from '@solana/web3.js';
import { getMinimumBalanceForRentExemptMint, getAssociatedTokenAddress } from '@solana/spl-token';
import BN from 'bn.js';
import {
  MetadataAccount,
  OriginalEditionAccount,
  PrintEditionAccount,
  EditionMarkerAccount,
} from '@/programs/tokenMetadata';
import { MintNewEditionOperation } from '../operations';
import { mintNewEditionBuilder } from '../transactionBuilders';
import { Metaplex } from '@/Metaplex';
import { OperationHandler, TransactionBuilder } from '@/shared';
import { AccountNotFoundError } from '@/errors';

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
    const masterEdition = await OriginalEditionAccount.pda(masterMint);
    const masterEditionAccount = OriginalEditionAccount.fromMaybe(
      await metaplex.rpc().getAccount(masterEdition)
    );

    if (!masterEditionAccount.exists) {
      throw new AccountNotFoundError(
        masterEdition,
        'MasterEdition',
        `Ensure the provided mint address for the master NFT [${masterMint.toBase58()}] ` +
          `is correct and that it has an associated MasterEdition PDA.`
      );
    }

    const edition = new BN(masterEditionAccount.data.supply, 'le').add(new BN(1));
    const masterEditionMarkPda = await EditionMarkerAccount.pda(masterMint, edition);

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
      masterMetadata,
      masterEdition,
      masterEditionMarkPda,
      tokenProgram,
      associatedTokenProgram,
    };

    let transactionBuilder: TransactionBuilder;
    if (operation.input.via === 'token') {
      const masterTokenAccountOwner =
        operation.input.masterTokenAccountOwner ?? metaplex.identity();
      const masterTokenAccount =
        operation.input.masterTokenAccount ??
        (await getAssociatedTokenAddress(
          masterMint,
          masterTokenAccountOwner.publicKey,
          false,
          tokenProgram,
          associatedTokenProgram
        ));

      transactionBuilder = mintNewEditionBuilder({
        via: 'token',
        masterTokenAccountOwner,
        masterTokenAccount,
        ...sharedInput,
      });
    } else {
      transactionBuilder = mintNewEditionBuilder({
        via: 'vault',
        vaultAuthority: operation.input.vaultAuthority,
        safetyDepositStore: operation.input.safetyDepositStore,
        safetyDepositBox: operation.input.safetyDepositBox,
        vault: operation.input.vault,
        tokenVaultProgram: operation.input.tokenVaultProgram,
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
