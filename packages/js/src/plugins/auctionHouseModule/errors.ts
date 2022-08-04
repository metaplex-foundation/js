import {
  MetaplexError,
  MetaplexErrorInputWithoutSource,
  MetaplexErrorOptions,
} from '@/errors';

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
