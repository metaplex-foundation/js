import type { PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { Task } from '@/utils';
import { TokenBuildersClient } from './TokenBuildersClient';
import { Mint } from './Mint';
import { Token, TokenWithMint } from './Token';
import {
  CreateMintInput,
  createMintOperation,
  CreateMintOutput,
} from './createMint';
import {
  CreateTokenInput,
  createTokenOperation,
  CreateTokenOutput,
} from './createToken';
import {
  CreateTokenWithMintInput,
  createTokenWithMintOperation,
  CreateTokenWithMintOutput,
} from './createTokenWithMint';
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
import {
  MintTokensInput,
  mintTokensOperation,
  MintTokensOutput,
} from './mintTokens';
import {
  SendTokensInput,
  sendTokensOperation,
  SendTokensOutput,
} from './sendTokens';

export class TokenClient {
  constructor(protected readonly metaplex: Metaplex) {}

  builders() {
    return new TokenBuildersClient(this.metaplex);
  }

  createMint(
    input: CreateMintInput = {}
  ): Task<CreateMintOutput & { mint: Mint }> {
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
    input: CreateTokenWithMintInput = {}
  ): Task<CreateTokenWithMintOutput & { token: TokenWithMint }> {
    return new Task(async (scope) => {
      const operation = createTokenWithMintOperation(input);
      const output = await this.metaplex.operations().execute(operation, scope);
      scope.throwIfCanceled();
      const token = await this.findTokenWithMintByMint({
        mint: output.mintSigner.publicKey,
        address: output.tokenAddress,
        addressType: 'token',
      }).run(scope);
      return { ...output, token };
    });
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

  findTokenWithMintByMint(input: FindTokenWithMintByMintInput) {
    return this.metaplex
      .operations()
      .getTask(findTokenWithMintByMintOperation(input));
  }

  mintTokens(input: MintTokensInput): Task<MintTokensOutput> {
    return this.metaplex.operations().getTask(mintTokensOperation(input));
  }

  sendTokens(input: SendTokensInput): Task<SendTokensOutput> {
    return this.metaplex.operations().getTask(sendTokensOperation(input));
  }
}
