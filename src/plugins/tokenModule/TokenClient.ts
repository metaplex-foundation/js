import type { Metaplex } from '@/Metaplex';
import { Task } from '@/utils';
import type { PublicKey } from '@solana/web3.js';
import {
  CreateMintInput,
  createMintOperation,
  CreateMintOutput,
} from './createMint';
import {
  FindMintByAddressInput,
  findMintByAddressOperation,
} from './findMintByAddress';
import {
  FindTokenByAddressInput,
  findTokenByAddressOperation,
} from './findTokenByAddress';
import {
  FindTokenWithMintByAddressInput,
  findTokenWithMintByAddressOperation,
} from './findTokenWithMintByAddress';
import {
  FindTokenWithMintByMintInput,
  findTokenWithMintByMintOperation,
} from './findTokenWithMintByMint';
import { TokenBuildersClient } from './TokenBuildersClient';
import { Mint } from './Mint';
import {
  CreateTokenInput,
  createTokenOperation,
  CreateTokenOutput,
} from './createToken';
import { Token, TokenWithMint } from './Token';
import {
  MintTokensInput,
  mintTokensOperation,
  MintTokensOutput,
} from './mintTokens';
import {
  CreateTokenWithMintInput,
  createTokenWithMintOperation,
  CreateTokenWithMintOutput,
} from './createTokenWithMint';

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

  createTokenWithMint(
    input: CreateTokenWithMintInput
  ): Task<CreateTokenWithMintOutput & { token: TokenWithMint }> {
    return new Task(async (scope) => {
      const operation = createTokenWithMintOperation(input);
      const output = await this.metaplex.operations().execute(operation, scope);
      scope.throwIfCanceled();
      const token = await this.findTokenWithMintByAddress(
        output.tokenAddress
      ).run(scope);
      return { ...output, token };
    });
  }

  mintTokens(input: MintTokensInput): Task<MintTokensOutput> {
    return this.metaplex.operations().getTask(mintTokensOperation(input));
  }

  findMintByAddress(
    address: PublicKey,
    options?: Omit<FindMintByAddressInput, 'address'>
  ) {
    return this.metaplex
      .operations()
      .getTask(findMintByAddressOperation({ address, ...options }));
  }

  findTokenByAddress(
    address: PublicKey,
    options?: Omit<FindTokenByAddressInput, 'address'>
  ) {
    return this.metaplex
      .operations()
      .getTask(findTokenByAddressOperation({ address, ...options }));
  }

  findTokenWithMintByAddress(
    address: PublicKey,
    options?: Omit<FindTokenWithMintByAddressInput, 'address'>
  ) {
    return this.metaplex
      .operations()
      .getTask(findTokenWithMintByAddressOperation({ address, ...options }));
  }

  findTokenWithMintByMint(
    mint: PublicKey,
    owner: PublicKey,
    options?: Omit<FindTokenWithMintByMintInput, 'mint' | 'owner'>
  ) {
    return this.metaplex
      .operations()
      .getTask(findTokenWithMintByMintOperation({ mint, owner, ...options }));
  }
}
