import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import {
  AuthorityScope,
  createCreateAuctionHouseInstruction,
  createDelegateAuctioneerInstruction,
} from '@metaplex-foundation/mpl-auction-house';
import type { Metaplex } from '@/Metaplex';
import {
  useOperation,
  Operation,
  Signer,
  OperationHandler,
  Pda,
  isSigner,
  toPublicKey,
} from '@/types';
import { TransactionBuilder } from '@/utils';
import { findAssociatedTokenAccountPda } from '../tokenModule';
import {
  findAuctioneerPda,
  findAuctionHouseFeePda,
  findAuctionHousePda,
  findAuctionHouseTreasuryPda,
} from './pdas';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { WRAPPED_SOL_MINT } from '../tokenModule';
import { AuthoritySignerRequiredError } from './errors';

// -----------------
// Operation
// -----------------

const Key = 'CreateAuctionHouseOperation' as const;
export const createAuctionHouseOperation =
  useOperation<CreateAuctionHouseOperation>(Key);
export type CreateAuctionHouseOperation = Operation<
  typeof Key,
  CreateAuctionHouseInput,
  CreateAuctionHouseOutput
>;

export type CreateAuctionHouseInput = {
  // Data.
  sellerFeeBasisPoints: number;
  requiresSignOff?: boolean;
  canChangeSalePrice?: boolean;
  auctioneerScopes?: AuthorityScope[];

  // Accounts.
  treasuryMint?: PublicKey;
  payer?: Signer;
  authority?: PublicKey | Signer; // Authority is required to sign when delegating to an Auctioneer instance.
  feeWithdrawalDestination?: PublicKey;
  treasuryWithdrawalDestinationOwner?: PublicKey;
  auctioneerAuthority?: PublicKey;

  // Options.
  confirmOptions?: ConfirmOptions;
};

export type CreateAuctionHouseOutput = {
  response: SendAndConfirmTransactionResponse;
  auctionHouseAddress: Pda;
  auctionHouseFeeAccountAddress: Pda;
  auctionHouseTreasuryAddress: Pda;
  treasuryWithdrawalDestinationAddress: PublicKey;
};

// -----------------
// Handler
// -----------------

export const createAuctionHouseOperationHandler: OperationHandler<CreateAuctionHouseOperation> =
  {
    handle: async (
      operation: CreateAuctionHouseOperation,
      metaplex: Metaplex
    ) => {
      return createAuctionHouseBuilder(
        metaplex,
        operation.input
      ).sendAndConfirm(metaplex, operation.input.confirmOptions);
    },
  };

// -----------------
// Builder
// -----------------

export type CreateAuctionHouseBuilderParams = Omit<
  CreateAuctionHouseInput,
  'confirmOptions'
> & {
  instructionKey?: string;
  delegateAuctioneerInstructionKey?: string;
};

export type CreateAuctionHouseBuilderContext = Omit<
  CreateAuctionHouseOutput,
  'response'
>;

export const createAuctionHouseBuilder = (
  metaplex: Metaplex,
  params: CreateAuctionHouseBuilderParams
): TransactionBuilder<CreateAuctionHouseBuilderContext> => {
  // Data.
  const canChangeSalePrice = params.canChangeSalePrice ?? false;
  const requiresSignOff = params.requiresSignOff ?? canChangeSalePrice;

  // Accounts.
  const authority = params.authority ?? metaplex.identity();
  const payer = params.payer ?? metaplex.identity();
  const treasuryMint = params.treasuryMint ?? WRAPPED_SOL_MINT;
  const treasuryWithdrawalDestinationOwner =
    params.treasuryWithdrawalDestinationOwner ?? metaplex.identity().publicKey;
  const feeWithdrawalDestination =
    params.feeWithdrawalDestination ?? metaplex.identity().publicKey;

  // Auctioneer delegate instruction needs to be signed by authority
  if (params.auctioneerAuthority && !isSigner(authority)) {
    throw new AuthoritySignerRequiredError();
  }

  // PDAs.
  const auctionHouse = findAuctionHousePda(
    toPublicKey(authority),
    treasuryMint
  );
  const auctionHouseFeeAccount = findAuctionHouseFeePda(auctionHouse);
  const auctionHouseTreasury = findAuctionHouseTreasuryPda(auctionHouse);
  const treasuryWithdrawalDestination = treasuryMint.equals(WRAPPED_SOL_MINT)
    ? treasuryWithdrawalDestinationOwner
    : findAssociatedTokenAccountPda(
        treasuryMint,
        treasuryWithdrawalDestinationOwner
      );

  return TransactionBuilder.make<CreateAuctionHouseBuilderContext>()
    .setFeePayer(payer)
    .setContext({
      auctionHouseAddress: auctionHouse,
      auctionHouseFeeAccountAddress: auctionHouseFeeAccount,
      auctionHouseTreasuryAddress: auctionHouseTreasury,
      treasuryWithdrawalDestinationAddress: treasuryWithdrawalDestination,
    })
    .add({
      instruction: createCreateAuctionHouseInstruction(
        {
          treasuryMint,
          payer: payer.publicKey,
          authority: toPublicKey(authority),
          feeWithdrawalDestination,
          treasuryWithdrawalDestination,
          treasuryWithdrawalDestinationOwner,
          auctionHouse,
          auctionHouseFeeAccount,
          auctionHouseTreasury,
        },
        {
          bump: auctionHouse.bump,
          feePayerBump: auctionHouseFeeAccount.bump,
          treasuryBump: auctionHouseTreasury.bump,
          sellerFeeBasisPoints: params.sellerFeeBasisPoints,
          requiresSignOff,
          canChangeSalePrice,
        }
      ),
      signers: [payer],
      key: params.instructionKey ?? 'createAuctionHouse',
    })
    .when(Boolean(params.auctioneerAuthority), (builder) => {
      const auctioneerAuthority = params.auctioneerAuthority as PublicKey;

      const ahAuctioneerPda = findAuctioneerPda(
        auctionHouse,
        auctioneerAuthority
      );

      const scopes = params.auctioneerScopes ?? [
        AuthorityScope.Deposit,
        AuthorityScope.Buy,
        AuthorityScope.PublicBuy,
        AuthorityScope.ExecuteSale,
        AuthorityScope.Sell,
        AuthorityScope.Cancel,
        AuthorityScope.Withdraw,
      ];

      builder.add({
        instruction: createDelegateAuctioneerInstruction(
          {
            auctionHouse,
            authority: toPublicKey(authority as Signer),
            auctioneerAuthority,
            ahAuctioneerPda,
          },
          {
            scopes,
          }
        ),
        signers: [authority as Signer],
        key: params.delegateAuctioneerInstructionKey ?? 'delegateAuctioneer',
      });

      return builder;
    });
};
