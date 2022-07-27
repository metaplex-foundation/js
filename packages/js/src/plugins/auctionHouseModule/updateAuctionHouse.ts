import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import {
  AuthorityScope,
  createDelegateAuctioneerInstruction,
  createUpdateAuctioneerInstruction,
  createUpdateAuctionHouseInstruction,
} from '@metaplex-foundation/mpl-auction-house';
import isEqual from 'lodash.isequal';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, Signer, OperationHandler } from '@/types';
import { TransactionBuilder } from '@/utils';
import { NoInstructionsToSendError } from '@/errors';
import { findAssociatedTokenAccountPda } from '../tokenModule';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { assertAuctioneerAuctionHouse, AuctionHouse } from './AuctionHouse';
import { TreasuryDestinationOwnerRequiredError } from './errors';
import { findAuctioneerPda } from './pdas';
import { AUCTIONEER_ALL_SCOPES } from './constants';

// -----------------
// Operation
// -----------------

const Key = 'UpdateAuctionHouseOperation' as const;
export const updateAuctionHouseOperation =
  useOperation<UpdateAuctionHouseOperation>(Key);
export type UpdateAuctionHouseOperation = Operation<
  typeof Key,
  UpdateAuctionHouseInput,
  UpdateAuctionHouseOutput
>;

export type UpdateAuctionHouseInput = {
  // Main Accounts.
  auctionHouse: AuctionHouse;
  authority?: Signer;
  payer?: Signer;

  // Updatable Data.
  sellerFeeBasisPoints?: number | null;
  requiresSignOff?: boolean | null;
  canChangeSalePrice?: boolean | null;
  newAuthority?: PublicKey;
  feeWithdrawalDestination?: PublicKey;
  treasuryWithdrawalDestinationOwner?: PublicKey;
  auctioneerAuthority?: PublicKey;
  auctioneerScopes?: AuthorityScope[];

  // Options.
  confirmOptions?: ConfirmOptions;
};

export type UpdateAuctionHouseOutput = {
  response: SendAndConfirmTransactionResponse;
};

// -----------------
// Handler
// -----------------

export const updateAuctionHouseOperationHandler: OperationHandler<UpdateAuctionHouseOperation> =
  {
    handle: async (
      operation: UpdateAuctionHouseOperation,
      metaplex: Metaplex
    ) => {
      const builder = await updateAuctionHouseBuilder(
        metaplex,
        operation.input
      );

      if (builder.isEmpty()) {
        throw new NoInstructionsToSendError(Key);
      }

      return builder.sendAndConfirm(metaplex, operation.input.confirmOptions);
    },
  };

// -----------------
// Builder
// -----------------

export type UpdateAuctionHouseBuilderParams = Omit<
  UpdateAuctionHouseInput,
  'confirmOptions'
> & {
  instructionKey?: string;
  delegateAuctioneerInstructionKey?: string;
  updateAuctioneerInstructionKey?: string;
};

export const updateAuctionHouseBuilder = async (
  metaplex: Metaplex,
  params: UpdateAuctionHouseBuilderParams
): Promise<TransactionBuilder> => {
  const authority = params.authority ?? metaplex.identity();
  const payer = params.payer ?? metaplex.identity();
  const auctionHouse = params.auctionHouse;

  let treasuryWithdrawalDestinationOwner: PublicKey;
  let treasuryWithdrawalDestination: PublicKey;
  if (auctionHouse.isNative) {
    treasuryWithdrawalDestinationOwner =
      params.treasuryWithdrawalDestinationOwner ??
      auctionHouse.treasuryWithdrawalDestinationAddress;
    treasuryWithdrawalDestination = treasuryWithdrawalDestinationOwner;
  } else if (params.treasuryWithdrawalDestinationOwner) {
    treasuryWithdrawalDestinationOwner =
      params.treasuryWithdrawalDestinationOwner;
    treasuryWithdrawalDestination = findAssociatedTokenAccountPda(
      auctionHouse.treasuryMint.address,
      treasuryWithdrawalDestinationOwner
    );
  } else {
    throw new TreasuryDestinationOwnerRequiredError();
  }

  const originalData = {
    authority: auctionHouse.authorityAddress,
    feeWithdrawalDestination: auctionHouse.feeWithdrawalDestinationAddress,
    treasuryWithdrawalDestination:
      auctionHouse.treasuryWithdrawalDestinationAddress,
    sellerFeeBasisPoints: auctionHouse.sellerFeeBasisPoints,
    requiresSignOff: auctionHouse.requiresSignOff,
    canChangeSalePrice: auctionHouse.canChangeSalePrice,
  };
  const updatedData = {
    authority: params.newAuthority ?? originalData.authority,
    feeWithdrawalDestination:
      params.feeWithdrawalDestination ?? originalData.feeWithdrawalDestination,
    treasuryWithdrawalDestination,
    sellerFeeBasisPoints:
      params.sellerFeeBasisPoints ?? originalData.sellerFeeBasisPoints,
    requiresSignOff: params.requiresSignOff ?? originalData.requiresSignOff,
    canChangeSalePrice:
      params.canChangeSalePrice ?? originalData.canChangeSalePrice,
  };

  const shouldSendUpdateInstruction = !isEqual(originalData, updatedData);
  const shouldDelegateAuctioneer =
    !auctionHouse.hasAuctioneer && !!params.auctioneerAuthority;
  const shouldUpdateAuctioneerAuthority =
    auctionHouse.hasAuctioneer &&
    !!params.auctioneerAuthority &&
    !params.auctioneerAuthority.equals(auctionHouse.auctioneer.authority);
  const shouldUpdateAuctioneerScopes =
    auctionHouse.hasAuctioneer &&
    !!params.auctioneerScopes &&
    !isEqual(
      params.auctioneerScopes.sort(),
      auctionHouse.auctioneer.scopes.sort()
    );
  const shouldUpdateAuctioneer =
    shouldUpdateAuctioneerAuthority || shouldUpdateAuctioneerScopes;

  return (
    TransactionBuilder.make()
      .setFeePayer(payer)

      // Update the Auction House data.
      .when(shouldSendUpdateInstruction, (builder) =>
        builder.add({
          instruction: createUpdateAuctionHouseInstruction(
            {
              treasuryMint: auctionHouse.treasuryMint.address,
              payer: payer.publicKey,
              authority: authority.publicKey,
              newAuthority: updatedData.authority,
              feeWithdrawalDestination: updatedData.feeWithdrawalDestination,
              treasuryWithdrawalDestination,
              treasuryWithdrawalDestinationOwner,
              auctionHouse: auctionHouse.address,
            },
            {
              sellerFeeBasisPoints: params.sellerFeeBasisPoints ?? null,
              requiresSignOff: params.requiresSignOff ?? null,
              canChangeSalePrice: params.canChangeSalePrice ?? null,
            }
          ),
          signers: [payer, authority],
          key: params.instructionKey ?? 'updateAuctionHouse',
        })
      )

      // Attach a new Auctioneer instance to the Auction House.
      .when(shouldDelegateAuctioneer, (builder) => {
        const auctioneerAuthority = params.auctioneerAuthority as PublicKey;
        return builder.add({
          instruction: createDelegateAuctioneerInstruction(
            {
              auctionHouse: auctionHouse.address,
              authority: authority.publicKey,
              auctioneerAuthority,
              ahAuctioneerPda: findAuctioneerPda(
                auctionHouse.address,
                auctioneerAuthority
              ),
            },
            { scopes: params.auctioneerScopes ?? AUCTIONEER_ALL_SCOPES }
          ),
          signers: [authority],
          key: params.delegateAuctioneerInstructionKey ?? 'delegateAuctioneer',
        });
      })

      // Update the Auctioneer instance of the Auction House or its scope.
      .when(shouldUpdateAuctioneer, (builder) => {
        assertAuctioneerAuctionHouse(auctionHouse);
        const auctioneerAuthority =
          params.auctioneerAuthority ??
          (auctionHouse.auctioneer.authority as PublicKey);
        return builder.add({
          instruction: createUpdateAuctioneerInstruction(
            {
              auctionHouse: auctionHouse.address,
              authority: authority.publicKey,
              auctioneerAuthority,
              ahAuctioneerPda: findAuctioneerPda(
                auctionHouse.address,
                auctioneerAuthority
              ),
            },
            {
              scopes: params.auctioneerScopes ?? auctionHouse.auctioneer.scopes,
            }
          ),
          signers: [authority],
          key: params.updateAuctioneerInstructionKey ?? 'updateAuctioneer',
        });
      })
  );
};
