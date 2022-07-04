import type { Metaplex } from '@/Metaplex';
import { Task } from '@/utils';
import type { Commitment, PublicKey } from '@solana/web3.js';
import {
  CreateMintInput,
  createMintOperation,
  CreateMintOutput,
} from './createMint';
import { findMintByAddressOperation } from './findMintByAddress';
import { findTokenByAddressOperation } from './findTokenByAddress';
import { findTokenWithMintByAddressOperation } from './findTokenWithMintByAddress';
import { findTokenWithMintByMintOperation } from './findTokenWithMintByMint';
import { TokenBuildersClient } from './TokenBuildersClient';
import { Mint } from './Mint';
import {
  CreateTokenInput,
  createTokenOperation,
  CreateTokenOutput,
} from './createToken';
import { Token } from './Token';
import {
  MintTokensInput,
  mintTokensOperation,
  MintTokensOutput,
} from './mintTokens';

export class TokenClient {
  constructor(protected readonly metaplex: Metaplex) {}

  builders() {
    return new TokenBuildersClient(this.metaplex);
  }

  createMint(input: CreateMintInput): Task<CreateMintOutput & { mint: Mint }> {
    return new Task(async (scope) => {
      const operation = createMintOperation(input);
      const output = await this.metaplex.operations().execute(operation, scope);
      scope.throwIfCanceled();
      const mint = await this.findMintByAddress(
        output.mintSigner.publicKey
      ).run(scope);
      return { ...output, mint };
    });
  }

  createToken(
    input: CreateTokenInput
  ): Task<CreateTokenOutput & { token: Token }> {
    return new Task(async (scope) => {
      const operation = createTokenOperation(input);
      const output = await this.metaplex.operations().execute(operation, scope);
      scope.throwIfCanceled();
      const token = await this.findTokenByAddress(output.tokenAddress).run(
        scope
      );
      return { ...output, token };
    });
  }

  mintTokens(input: MintTokensInput): Task<MintTokensOutput> {
    return this.metaplex.operations().getTask(mintTokensOperation(input));
  }

  findMintByAddress(address: PublicKey, commitment?: Commitment) {
    return this.metaplex
      .operations()
      .getTask(findMintByAddressOperation({ address, commitment }));
  }

  findTokenByAddress(address: PublicKey, commitment?: Commitment) {
    return this.metaplex
      .operations()
      .getTask(findTokenByAddressOperation({ address, commitment }));
  }

  findTokenWithMintByAddress(address: PublicKey, commitment?: Commitment) {
    return this.metaplex
      .operations()
      .getTask(findTokenWithMintByAddressOperation({ address, commitment }));
  }

  findTokenWithMintByMint(
    mintAddress: PublicKey,
    ownerAddress: PublicKey,
    commitment?: Commitment
  ) {
    return this.metaplex.operations().getTask(
      findTokenWithMintByMintOperation({
        mintAddress,
        ownerAddress,
        commitment,
      })
    );
  }
}
