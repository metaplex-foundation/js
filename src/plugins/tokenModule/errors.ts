import { MetaplexError, MetaplexErrorInputWithoutSource } from '@/errors';

export class TokenError extends MetaplexError {
  constructor(input: MetaplexErrorInputWithoutSource) {
    super({
      ...input,
      key: `plugin.token.${input.key}`,
      title: `Token > ${input.title}`,
      source: 'plugin',
      sourceDetails: 'Token',
    });
  }
}

export class MintAuthorityMustBeSignerToMintInitialSupplyError extends TokenError {
  constructor(cause?: Error) {
    super({
      cause,
      key: 'mint_authority_must_be_signer_to_mint_initial_supply',
      title: 'Mint Authority Must Be Signer To Mint Initial Supply',
      problem:
        'You are trying to create a Mint and a Token account and to send an initial ' +
        'supply of token to the newly created Token account. The issue is, you have provided ' +
        "a Mint Authority as a Public Key which means we don't have the rights to send this transaction.",
      solution:
        'Please provide the Mint Authority as a Signer when using the "createTokenWithMint" operation ' +
        ', so we can send the initial supply. Alternative, remove the initial supply from the operation for it to succeed.',
    });
  }
}
