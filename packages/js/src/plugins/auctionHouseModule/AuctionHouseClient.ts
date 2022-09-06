import type { Metaplex } from '@/Metaplex';
import { Task } from '@/utils';
import { AuctionHouse, Bid, Listing, Purchase } from './models';
import { AuctionHouseBuildersClient } from './AuctionHouseBuildersClient';
import {
  CancelBidInput,
  cancelBidOperation,
  CancelBidOutput,
  CancelListingInput,
  cancelListingOperation,
  CancelListingOutput,
  CreateAuctionHouseInput,
  createAuctionHouseOperation,
  CreateAuctionHouseOutput,
  CreateBidInput,
  createBidOperation,
  CreateBidOutput,
  CreateListingInput,
  createListingOperation,
  CreateListingOutput,
  DepositToBuyerAccountInput,
  depositToBuyerAccountOperation,
  DepositToBuyerAccountOutput,
  ExecuteSaleInput,
  executeSaleOperation,
  ExecuteSaleOutput,
  FindAuctionHouseByAddressInput,
  findAuctionHouseByAddressOperation,
  FindAuctionHouseByCreatorAndMintInput,
  findAuctionHouseByCreatorAndMintOperation,
  FindBidByReceiptInput,
  findBidByReceiptOperation,
  FindBidByTradeStateInput,
  findBidByTradeStateOperation,
  FindBidsByPublicKeyFieldInput,
  findBidsByPublicKeyFieldOperation,
  FindListingByReceiptInput,
  findListingByReceiptOperation,
  FindListingByTradeStateInput,
  findListingByTradeStateOperation,
  FindListingsByPublicKeyFieldInput,
  findListingsByPublicKeyFieldOperation,
  FindPurchaseByReceiptInput,
  findPurchaseByReceiptOperation,
  FindPurchaseByTradeStateInput,
  findPurchaseByTradeStateOperation,
  FindPurchasesByPublicKeyFieldInput,
  findPurchasesByPublicKeyFieldOperation,
  GetBuyerBalanceInput,
  GetBuyerBalanceOutput,
  getBuyerBalanceOperation,
  LoadBidInput,
  loadBidOperation,
  LoadListingInput,
  loadListingOperation,
  LoadPurchaseInput,
  loadPurchaseOperation,
  UpdateAuctionHouseInput,
  updateAuctionHouseOperation,
  UpdateAuctionHouseOutput,
} from './operations';

/**
 * @group Modules
 */
export class AuctionHouseClient {
  constructor(protected readonly metaplex: Metaplex) {}

  /**
   * You may use the `builders()` client to access the
   * underlying Transaction Builders of this module.
   *
   * ```ts
   * const buildersClient = metaplex.auctions().builders();
   * ```
   */
  builders() {
    return new AuctionHouseBuildersClient(this.metaplex);
  }

  /** {@inheritDoc createBidOperation} */
  bid(input: CreateBidInput): Task<CreateBidOutput> {
    return this.metaplex.operations().getTask(createBidOperation(input));
  }

  /** {@inheritDoc depositToBuyerAccountOperation} */
  depositToBuyerAccount(
    input: DepositToBuyerAccountInput
  ): Task<DepositToBuyerAccountOutput> {
    return this.metaplex
      .operations()
      .getTask(depositToBuyerAccountOperation(input));
  }

  /** {@inheritDoc createAuctionHouseOperation} */
  create(input: CreateAuctionHouseInput): Task<CreateAuctionHouseOutput> {
    return this.metaplex
      .operations()
      .getTask(createAuctionHouseOperation(input));
  }

  /** {@inheritDoc cancelBidOperation} */
  cancelBid(input: CancelBidInput): Task<CancelBidOutput> {
    return this.metaplex.operations().getTask(cancelBidOperation(input));
  }

  /** {@inheritDoc cancelListingOperation} */
  cancelListing(input: CancelListingInput): Task<CancelListingOutput> {
    return this.metaplex.operations().getTask(cancelListingOperation(input));
  }

  /** {@inheritDoc executeSaleOperation} */
  executeSale(input: ExecuteSaleInput): Task<ExecuteSaleOutput> {
    return this.metaplex.operations().getTask(executeSaleOperation(input));
  }

  /** {@inheritDoc findAuctionHouseByAddressOperation} */
  findByAddress(options: FindAuctionHouseByAddressInput): Task<AuctionHouse> {
    return this.metaplex
      .operations()
      .getTask(findAuctionHouseByAddressOperation(options));
  }

  /** {@inheritDoc findAuctionHouseByCreatorAndMintOperation} */
  findByCreatorAndMint(
    options: FindAuctionHouseByCreatorAndMintInput
  ): Task<AuctionHouse> {
    return this.metaplex
      .operations()
      .getTask(findAuctionHouseByCreatorAndMintOperation(options));
  }

  /** {@inheritDoc findBidByReceiptOperation} */
  findBidByReceipt(options: FindBidByReceiptInput) {
    return this.metaplex
      .operations()
      .getTask(findBidByReceiptOperation(options));
  }

  /** {@inheritDoc findBidByTradeStateOperation} */
  findBidByTradeState(options: FindBidByTradeStateInput) {
    return this.metaplex
      .operations()
      .getTask(findBidByTradeStateOperation(options));
  }

  /** {@inheritDoc findListingByTradeStateOperation} */
  findListingByTradeState(options: FindListingByTradeStateInput) {
    return this.metaplex
      .operations()
      .getTask(findListingByTradeStateOperation(options));
  }

  /** {@inheritDoc findListingByReceiptOperation} */
  findListingByReceipt(options: FindListingByReceiptInput) {
    return this.metaplex
      .operations()
      .getTask(findListingByReceiptOperation(options));
  }

  /** {@inheritDoc findPurchaseByTradeStateOperation} */
  findPurchaseByTradeState(options: FindPurchaseByTradeStateInput) {
    return this.metaplex
      .operations()
      .getTask(findPurchaseByTradeStateOperation(options));
  }

  /** {@inheritDoc findPurchaseByReceiptOperation} */
  findPurchaseByReceipt(options: FindPurchaseByReceiptInput) {
    return this.metaplex
      .operations()
      .getTask(findPurchaseByReceiptOperation(options));
  }

  /** {@inheritDoc getBuyerBalanceOperation} */
  getBuyerBalance(options: GetBuyerBalanceInput): Task<GetBuyerBalanceOutput> {
    return this.metaplex
      .operations()
      .getTask(getBuyerBalanceOperation(options));
  }

  /** {@inheritDoc createListingOperation} */
  list(input: CreateListingInput): Task<CreateListingOutput> {
    return this.metaplex.operations().getTask(createListingOperation(input));
  }

  /** {@inheritDoc loadBidOperation} */
  loadBid(options: LoadBidInput): Task<Bid> {
    return this.metaplex.operations().getTask(loadBidOperation(options));
  }

  /** {@inheritDoc loadListingOperation} */
  loadListing(options: LoadListingInput): Task<Listing> {
    return this.metaplex.operations().getTask(loadListingOperation(options));
  }

  /** {@inheritDoc loadPurchaseOperation} */
  loadPurchase(options: LoadPurchaseInput): Task<Purchase> {
    return this.metaplex.operations().getTask(loadPurchaseOperation(options));
  }

  /** {@inheritDoc updateAuctionHouseOperation} */
  update(options: UpdateAuctionHouseInput): Task<UpdateAuctionHouseOutput> {
    return this.metaplex
      .operations()
      .getTask(updateAuctionHouseOperation(options));
  }

  /** {@inheritDoc findBidsByPublicKeyFieldOperation} */
  findBidsBy(input: FindBidsByPublicKeyFieldInput) {
    return this.metaplex
      .operations()
      .getTask(findBidsByPublicKeyFieldOperation(input));
  }

  /** {@inheritDoc findListingsByPublicKeyFieldOperation} */
  findListingsBy(input: FindListingsByPublicKeyFieldInput) {
    return this.metaplex
      .operations()
      .getTask(findListingsByPublicKeyFieldOperation(input));
  }

  /** {@inheritDoc findPurchasesByPublicKeyFieldOperation} */
  findPurchasesBy(input: FindPurchasesByPublicKeyFieldInput) {
    return this.metaplex
      .operations()
      .getTask(findPurchasesByPublicKeyFieldOperation(input));
  }
}
