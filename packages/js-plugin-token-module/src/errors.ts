import { PublicKey } from '@solana/web3.js';
import {
  MetaplexError,
  MetaplexErrorInputWithoutSource,
  MetaplexErrorOptions,
} from '@/errors';

/** @group Errors */
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

/** @group Errors */
export class MintAuthorityMustBeSignerToMintInitialSupplyError extends TokenError {
  constructor(options?: MetaplexErrorOptions) {
    super({
      options,
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

/** @group Errors */
export class TokenAndMintDoNotMatchError extends TokenError {
  constructor(
    token: PublicKey,
    tokenMint: PublicKey,
    mint: PublicKey,
    options?: MetaplexErrorOptions
  ) {
    super({
      options,
      key: 'token_and_mint_do_not_match',
      title: 'Token And Mint Do Not Match',
      problem:
        `The provided Token and Mint accounts do not match. That is, the mint address [${tokenMint}] ` +
        `stored in the Token account [${token}] do not match the address of the Mint account [${mint}]. `,
      solution:
        'Please provide a Token account that belongs to the provided Mint account.',
    });
  }
}
