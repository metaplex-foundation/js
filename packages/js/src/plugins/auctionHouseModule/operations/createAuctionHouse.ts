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
import { DisposableScope, TransactionBuilder } from '@/utils';
import { findAssociatedTokenAccountPda } from '../../tokenModule';
import {
  findAuctioneerPda,
  findAuctionHouseFeePda,
  findAuctionHousePda,
  findAuctionHouseTreasuryPda,
} from '../pdas';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { WRAPPED_SOL_MINT } from '../../tokenModule';
import { AUCTIONEER_ALL_SCOPES } from '../constants';
import { ExpectedSignerError } from '@/errors';
import { AuctionHouse } from '../models/AuctionHouse';

// -----------------
// Operation
// -----------------

const Key = 'CreateAuctionHouseOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const createAuctionHouseOperation =
  useOperation<CreateAuctionHouseOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type CreateAuctionHouseOperation = Operation<
  typeof Key,
  CreateAuctionHouseInput,
  CreateAuctionHouseOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
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

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type CreateAuctionHouseOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
  auctionHouseAddress: Pda;
  auctionHouseFeeAccountAddress: Pda;
  auctionHouseTreasuryAddress: Pda;
  treasuryWithdrawalDestinationAddress: PublicKey;
  auctionHouse: AuctionHouse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const createAuctionHouseOperationHandler: OperationHandler<CreateAuctionHouseOperation> =
  {
    async handle(
      operation: CreateAuctionHouseOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<CreateAuctionHouseOutput> {
      const output = await createAuctionHouseBuilder(
        metaplex,
        operation.input
      ).sendAndConfirm(metaplex, operation.input.confirmOptions);
      scope.throwIfCanceled();
      const auctionHouse = await metaplex
        .auctionHouse()
        .findByAddress({
          address: output.auctionHouseAddress,
          auctioneerAuthority: operation.input.auctioneerAuthority,
        })
        .run(scope);
      return { ...output, auctionHouse };
    },
  };

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type CreateAuctionHouseBuilderParams = Omit<
  CreateAuctionHouseInput,
  'confirmOptions'
> & {
  instructionKey?: string;
  delegateAuctioneerInstructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type CreateAuctionHouseBuilderContext = Omit<
  CreateAuctionHouseOutput,
  'response' | 'auctionHouse'
>;

/**
 * @group Transaction Builders
 * @category Constructors
 */
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
    throw new ExpectedSignerError('authority', 'PublicKey', {
      problemSuffix:
        'You are trying to delegate to an Auctioneer authority which ' +
        'requires the Auction House authority to sign a transaction. ' +
        'But you provided the Auction House authority as a Public Key.',
    });
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

  return (
    TransactionBuilder.make<CreateAuctionHouseBuilderContext>()
      .setFeePayer(payer)
      .setContext({
        auctionHouseAddress: auctionHouse,
        auctionHouseFeeAccountAddress: auctionHouseFeeAccount,
        auctionHouseTreasuryAddress: auctionHouseTreasury,
        treasuryWithdrawalDestinationAddress: treasuryWithdrawalDestination,
      })

      // Create and initialize the Auction House account.
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

      // Delegate to the Auctioneer authority when provided.
      .when(Boolean(params.auctioneerAuthority), (builder) => {
        const auctioneerAuthority = params.auctioneerAuthority as PublicKey;
        return builder.add({
          instruction: createDelegateAuctioneerInstruction(
            {
              auctionHouse,
              authority: toPublicKey(authority as Signer),
              auctioneerAuthority,
              ahAuctioneerPda: findAuctioneerPda(
                auctionHouse,
                auctioneerAuthority
              ),
            },
            { scopes: params.auctioneerScopes ?? AUCTIONEER_ALL_SCOPES }
          ),
          signers: [authority as Signer],
          key: params.delegateAuctioneerInstructionKey ?? 'delegateAuctioneer',
        });
      })
  );
};
