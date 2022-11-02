import {
  MetaplexError,
  MetaplexErrorInputWithoutSource,
  MetaplexErrorOptions,
} from '@/errors';
import { Amount, formatAmount } from '@/types';

/** @group Errors */
export class AuctionHouseError extends MetaplexError {
  constructor(input: MetaplexErrorInputWithoutSource) {
    super({
      ...input,
      key: `plugin.auction_house.${input.key}`,
      title: `AuctionHouse > ${input.title}`,
      source: 'plugin',
      sourceDetails: 'AuctionHouse',
    });
  }
}

/** @group Errors */
export class TreasuryDestinationOwnerRequiredError extends AuctionHouseError {
  constructor(options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'treasury_destination_owner_required',
      title: 'Treasury Destination Owner Required',
      problem:
        'You are trying to update an Auction House which uses a custom token as a treasury. ' +
        'You have not provided the "treasuryWithdrawalDestinationOwner" because you do not wish to change it. ' +
        'However, the Auction House account does not keep track of that information so we cannot prefill that for you. ' +
        'Thus, if you wish to keep the same treasury withdrawal, you must provide it explicilty.',
      solution:
        'Please provide the current "treasuryWithdrawalDestinationOwner" parameter so you can update the other fields.' +
        'Note that we keep that parameter optional because no Associate Token Account is needed for Auction Houses ' +
        'whose treasury is the native SOL.',
    });
  }
}

/** @group Errors */
export class AuctioneerAuthorityRequiredError extends AuctionHouseError {
  constructor(options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'auctioneer_authority_required',
      title: 'Auctioneer Authority Required',
      problem:
        'You are trying to use or fetch an Auction House which delegates to an Auctioneer authority ' +
        'but you have not provided the required "auctioneerAuthority" parameter.',
      solution:
        'Please provide the "auctioneerAuthority" parameter so the SDK can figure out which Auctioneer instance to interact with. ' +
        'Note that we keep that parameter optional because no Auctioneer Authority is needed for Auction Houses ' +
        'that use native Auction House behavior.',
    });
  }
}

/** @group Errors */
export class AuctioneerPartialSaleNotSupportedError extends AuctionHouseError {
  constructor(options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'auctioneer_partial_sale_not_supported',
      title: 'Auctioneer Partial Sale Is Not Supported',
      problem:
        'You are trying to execute a partial sale, but partial orders are not supported in Auctioneer.',
      solution:
        'Any Partial Buys must be executed against a sale listed through the Auction House Sale.',
    });
  }
}

/** @group Errors */
export class BidAndListingHaveDifferentAuctionHousesError extends AuctionHouseError {
  constructor(options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'bid_and_listing_have_different_auction_houses',
      title: 'Bid And Listing Have Different Auction Houses',
      problem:
        'You are trying to use a Bid and a Listing from different Auction Houses.',
      solution:
        'Please provide both Bid and Listing from the same Auction House. ' +
        'They should have the same "auctionHouse.address".',
    });
  }
}

/** @group Errors */
export class BidAndListingHaveDifferentMintsError extends AuctionHouseError {
  constructor(options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'bid_and_listing_have_different_mints',
      title: 'Bid And Listing Have Different Mints',
      problem:
        'You are trying to execute a sale using a Bid and a Listing that have different mint addresses.',
      solution:
        'Please provide a Bid and a Listing on the same asset in order to execute the sale. ' +
        'They should have the same "asset.address".',
    });
  }
}

/** @group Errors */
export class CanceledBidIsNotAllowedError extends AuctionHouseError {
  constructor(options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'canceled_bid_is_not_allowed',
      title: 'Canceled Bid Is Not Allowed',
      problem: 'You are trying to execute a sale using a canceled Bid.',
      solution:
        'Please provide a Bid that is not cancelled in order to execute the sale.',
    });
  }
}

/** @group Errors */
export class CanceledListingIsNotAllowedError extends AuctionHouseError {
  constructor(options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'canceled_listing_is_not_allowed',
      title: 'Canceled Listing Is Not Allowed',
      problem: 'You are trying to execute a sale using a canceled Listing.',
      solution:
        'Please provide a Listing that is not cancelld in order to execute the sale.',
    });
  }
}

/** @group Errors */
export class CreateListingRequiresSignerError extends AuctionHouseError {
  constructor(options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'create_listing_requires_signer',
      title: 'Create Listing Requires Signer',
      problem: 'You are trying to create a listing without providing a signer.',
      solution: 'Either a seller or authority must be a Signer.',
    });
  }
}

/** @group Errors */
export class WithdrawFromBuyerAccountRequiresSignerError extends AuctionHouseError {
  constructor(options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'withdraw_from_buyer_account_requires_signer',
      title: 'Withdraw From Buyer Account Requires Signer',
      problem:
        'You are trying to withdraw from buyer account without providing a signer.',
      solution: 'Either a buyer or authority must be a Signer.',
    });
  }
}

/** @group Errors */
export class PartialPriceMismatchError extends AuctionHouseError {
  constructor(
    expected: Amount,
    actual: Amount,
    options?: MetaplexErrorOptions
  ) {
    super({
      options,
      key: 'partial_price_mismatch_signer',
      title:
        'The calculated partial price does not equal the partial price provided',
      problem: `Expected to receive ${formatAmount(
        expected
      )} per SFT but provided ${formatAmount(actual)} per SFT.`,
      solution:
        'The token price must equal the price it has in the listing. ' +
        'If executing a partial sale, ' +
        'divide the total price by the number of total tokens on sale and multiply it by the number of tokens you want to buy.',
    });
  }
}

/** @group Errors */
export class FindAllSupportsOnlyThreeFiltersMaxError extends AuctionHouseError {
  constructor(options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'find_all_supports_only_three_filters_max',
      title: 'Find all supports only three filters max',
      problem:
        'Solana filter allows only to provide four custom filters, one of the filters is internal so it is only possible to provide 3 custom filters.',
      solution: 'Please provide less filters to the find all query.',
    });
  }
}
