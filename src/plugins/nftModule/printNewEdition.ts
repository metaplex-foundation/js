import { ConfirmOptions, Keypair, PublicKey } from '@solana/web3.js';
import { getMinimumBalanceForRentExemptMint } from '@solana/spl-token';
import BN from 'bn.js';
import { Metaplex } from '@/Metaplex';
import {
  createMintAndMintToAssociatedTokenBuilder,
  createMintNewEditionFromMasterEditionViaTokenInstructionWithSigners,
  createMintNewEditionFromMasterEditionViaVaultProxyInstructionWithSigners,
  parseOriginalEditionAccount,
  findEditionMarkerPda,
  findEditionPda,
  findMasterEditionV2Pda,
  findMetadataPda,
  findAssociatedTokenAccountPda,
} from '@/programs';
import { useOperation, Operation, OperationHandler, Signer } from '@/types';
import { AccountNotFoundError } from '@/errors';
import { InstructionWithSigners, TransactionBuilder } from '@/utils';

const Key = 'PrintNewEditionOperation' as const;
export const printNewEditionOperation =
  useOperation<PrintNewEditionOperation>(Key);
export type PrintNewEditionOperation = Operation<
  typeof Key,
  PrintNewEditionInput,
  PrintNewEditionOutput
>;

export type PrintNewEditionInput = PrintNewEditionSharedInput &
  PrintNewEditionViaInput;

export type PrintNewEditionSharedInput = {
  originalMint: PublicKey;
  newMint?: Signer;
  newMintAuthority?: Signer;
  newUpdateAuthority?: PublicKey;
  newOwner?: PublicKey;
  newFreezeAuthority?: PublicKey;
  payer?: Signer;
  tokenProgram?: PublicKey;
  associatedTokenProgram?: PublicKey;
  confirmOptions?: ConfirmOptions;
};

export type PrintNewEditionViaInput =
  | {
      via?: 'token';
      originalTokenAccountOwner?: Signer;
      originalTokenAccount?: PublicKey;
    }
  | {
      via: 'vault';
      vaultAuthority: Signer;
      safetyDepositStore: PublicKey;
      safetyDepositBox: PublicKey;
      vault: PublicKey;
      tokenVaultProgram?: PublicKey;
    };

export type PrintNewEditionOutput = {
  mint: Signer;
  metadata: PublicKey;
  edition: PublicKey;
  associatedToken: PublicKey;
  transactionId: string;
};

export const printNewEditionOperationHandler: OperationHandler<PrintNewEditionOperation> =
  {
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
      const originalMetadata = findMetadataPda(originalMint);
      const originalEdition = findMasterEditionV2Pda(originalMint);
      const originalEditionAccount = parseOriginalEditionAccount(
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

      const edition = new BN(originalEditionAccount.data.supply, 'le').add(
        new BN(1)
      );
      const originalEditionMarkPda = findEditionMarkerPda(
        originalMint,
        edition
      );

      // New NFT.
      const newMetadata = findMetadataPda(newMint.publicKey);
      const newEdition = findEditionPda(newMint.publicKey);
      const lamports = await getMinimumBalanceForRentExemptMint(
        metaplex.connection
      );
      const newAssociatedToken = findAssociatedTokenAccountPda(
        newMint.publicKey,
        newOwner,
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
          findAssociatedTokenAccountPda(
            originalMint,
            originalTokenAccountOwner.publicKey,
            tokenProgram,
            associatedTokenProgram
          );

        transactionBuilder = printNewEditionBuilder({
          via: 'token',
          originalTokenAccountOwner,
          originalTokenAccount,
          ...sharedInput,
        });
      }

      const { signature } = await metaplex
        .rpc()
        .sendAndConfirmTransaction(
          transactionBuilder,
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

type PrintNewEditionBuilderSharedParams = {
  // Data.
  lamports: number;
  edition: number | BN;

  // New NFT.
  newMint: Signer;
  newMetadata: PublicKey;
  newEdition: PublicKey;
  newMintAuthority: Signer;
  newUpdateAuthority: PublicKey;
  newOwner: PublicKey;
  newAssociatedToken: PublicKey;
  newFreezeAuthority?: PublicKey;
  payer: Signer;

  // Master NFT.
  originalMetadata: PublicKey;
  originalEdition: PublicKey;
  originalEditionMarkPda: PublicKey;

  // Programs.
  tokenProgram?: PublicKey;
  associatedTokenProgram?: PublicKey;

  // Instruction keys.
  createAccountInstructionKey?: string;
  initializeMintInstructionKey?: string;
  createAssociatedTokenInstructionKey?: string;
  mintToInstructionKey?: string;
  printNewEditionInstructionKey?: string;
};

export type PrintNewEditionBuilderParams = PrintNewEditionBuilderSharedParams &
  (
    | {
        via: 'token';
        originalTokenAccountOwner: Signer;
        originalTokenAccount: PublicKey;
      }
    | {
        via: 'vault';
        vaultAuthority: Signer;
        safetyDepositStore: PublicKey;
        safetyDepositBox: PublicKey;
        vault: PublicKey;
        tokenVaultProgram?: PublicKey;
      }
  );

export const printNewEditionBuilder = (
  params: PrintNewEditionBuilderParams
): TransactionBuilder => {
  const {
    // Data.
    lamports,
    edition,

    // New NFT.
    newMint,
    newMetadata,
    newEdition,
    newMintAuthority,
    newUpdateAuthority,
    newOwner,
    newAssociatedToken,
    newFreezeAuthority,
    payer,

    // Master NFT.
    originalMetadata,
    originalEdition,
    originalEditionMarkPda,

    // Programs.
    tokenProgram,
    associatedTokenProgram,

    // Instruction keys.
    createAccountInstructionKey,
    initializeMintInstructionKey,
    createAssociatedTokenInstructionKey,
    mintToInstructionKey,
    printNewEditionInstructionKey = 'printNewEdition',
  } = params;

  let printNewEditionInstructionWithSigners: InstructionWithSigners;
  if (params.via === 'vault') {
    printNewEditionInstructionWithSigners =
      createMintNewEditionFromMasterEditionViaVaultProxyInstructionWithSigners({
        edition,
        newMetadata,
        newEdition,
        masterEdition: originalEdition,
        newMint,
        editionMarkPda: originalEditionMarkPda,
        newMintAuthority,
        payer,
        vaultAuthority: params.vaultAuthority,
        safetyDepositStore: params.safetyDepositStore,
        safetyDepositBox: params.safetyDepositBox,
        vault: params.vault,
        newMetadataUpdateAuthority: newUpdateAuthority,
        metadata: originalMetadata,
        tokenVaultProgram: params.tokenVaultProgram,
        instructionKey: printNewEditionInstructionKey,
      });
  } else {
    printNewEditionInstructionWithSigners =
      createMintNewEditionFromMasterEditionViaTokenInstructionWithSigners({
        edition,
        newMetadata,
        newEdition,
        masterEdition: originalEdition,
        newMint,
        editionMarkPda: originalEditionMarkPda,
        newMintAuthority,
        payer,
        tokenAccountOwner: params.originalTokenAccountOwner,
        tokenAccount: params.originalTokenAccount,
        newMetadataUpdateAuthority: newUpdateAuthority,
        metadata: originalMetadata,
        instructionKey: printNewEditionInstructionKey,
      });
  }

  return (
    TransactionBuilder.make()
      .setFeePayer(payer)

      // Create the mint account and send one token to the holder.
      .add(
        createMintAndMintToAssociatedTokenBuilder({
          lamports,
          decimals: 0,
          amount: 1,
          createAssociatedToken: true,
          mint: newMint,
          payer,
          mintAuthority: newMintAuthority,
          owner: newOwner,
          associatedToken: newAssociatedToken,
          freezeAuthority: newFreezeAuthority,
          tokenProgram,
          associatedTokenProgram,
          createAccountInstructionKey,
          initializeMintInstructionKey,
          createAssociatedTokenInstructionKey,
          mintToInstructionKey,
        })
      )

      // Mint new edition.
      .add(printNewEditionInstructionWithSigners)
  );
};
