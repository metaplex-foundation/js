import { MetaplexError, MetaplexErrorInputWithoutSource } from '@/errors';

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
  constructor(cause?: Error) {
    super({
      cause,
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

export class AuthoritySignerRequiredError extends AuctionHouseError {
  constructor(cause?: Error) {
    super({
      cause,
      key: 'authority_signer_required',
      title: 'Authority Signer Required',
      problem:
        'You are trying to delegate an Auctioneer which requires authority to sign a transaction. ' +
        'But you have provided only a Public Key.',
      solution:
        'Please provide the current "authority" parameter as a Signer (pair of Public Key and Secret Key).',
    });
  }
}

export class AuctioneerAuthorityRequiredError extends AuctionHouseError {
  constructor(cause?: Error) {
    super({
      cause,
      key: 'auctioneer_authority_required',
      title: 'Auctioneer Authority Required',
      problem:
        'You are trying to use an Auction House which delegates to an Auctioneer authority ' +
        'but you have not provided the required "auctioneerAuthority" parameter.',
      solution:
        'Please provide the "auctioneerAuthority" parameter as a Signer so Auctioneer instructions can be sent. ' +
        'Note that we keep that parameter optional because no Auctioneer Authority is needed for Auction Houses ' +
        'that use native Auction House behavior.',
    });
  }
}
