import type { default as NodeBundlr, WebBundlr } from '@bundlr-network/client';
import * as BundlrPackage from '@bundlr-network/client';
import BigNumber from 'bignumber.js';
import BN from 'bn.js';
import { Metaplex } from '@/Metaplex';
import { Amount, IdentitySigner, KeypairSigner, lamports } from '@/types';
import {
  AssetUploadFailedError,
  BundlrWithdrawError,
  FailedToConnectToBundlrAddressError,
  FailedToInitializeBundlrError,
} from '@/errors';
import {
  getBytesFromMetaplexFiles,
  MetaplexFile,
  MetaplexFileTag,
  StorageDriver,
} from '../storageModule';
import {
  Connection,
  PublicKey,
  SendOptions,
  Signer as Web3Signer,
  Transaction,
  TransactionSignature,
} from '@solana/web3.js';

export type BundlrOptions = {
  address?: string;
  timeout?: number;
  providerUrl?: string;
  priceMultiplier?: number;
  withdrawAfterUploading?: boolean;
};

export type BundlrWalletAdapter = {
  publicKey: PublicKey | null;
  signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
  signTransaction?: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions?: (transaction: Transaction[]) => Promise<Transaction[]>;
  sendTransaction: (
    transaction: Transaction,
    connection: Connection,
    options?: SendOptions & { signers?: Web3Signer[] }
  ) => Promise<TransactionSignature>;
};

export class BundlrStorageDriver implements StorageDriver {
  protected _metaplex: Metaplex;
  protected _bundlr: WebBundlr | NodeBundlr | null = null;
  protected _options: BundlrOptions;

  constructor(metaplex: Metaplex, options: BundlrOptions = {}) {
    this._metaplex = metaplex;
    this._options = {
      providerUrl: metaplex.connection.rpcEndpoint,
      ...options,
    };
  }

  async getUploadPrice(bytes: number): Promise<Amount> {
    const bundlr = await this.bundlr();
    const price = await bundlr.getPrice(bytes);

    return bigNumberToAmount(
      price.multipliedBy(this._options.priceMultiplier ?? 1.5)
    );
  }

  async upload(file: MetaplexFile): Promise<string> {
    const [uri] = await this.uploadAll([file]);

    return uri;
  }

  async uploadAll(files: MetaplexFile[]): Promise<string[]> {
    const bundlr = await this.bundlr();
    const amount = await this.getUploadPrice(
      getBytesFromMetaplexFiles(...files)
    );
    await this.fund(amount);

    const promises = files.map(async (file) => {
      const { status, data } = await bundlr.uploader.upload(
        file.buffer,
        getMetaplexFileTagsWithContentType(file)
      );

      if (status >= 300) {
        throw new AssetUploadFailedError(status);
      }

      return `https://arweave.net/${data.id}`;
    });

    return await Promise.all(promises);
  }

  async getBalance(): Promise<Amount> {
    const bundlr = await this.bundlr();
    const balance = await bundlr.getLoadedBalance();

    return bigNumberToAmount(balance);
  }

  async fund(amount: Amount, skipBalanceCheck = false): Promise<void> {
    const bundlr = await this.bundlr();
    let toFund = amountToBigNumber(amount);

    if (!skipBalanceCheck) {
      const balance = await bundlr.getLoadedBalance();

      toFund = toFund.isGreaterThan(balance)
        ? toFund.minus(balance)
        : new BigNumber(0);
    }

    if (toFund.isLessThanOrEqualTo(0)) {
      return;
    }

    // TODO: Catch errors and wrap in BundlrErrors.
    await bundlr.fund(toFund);
  }

  async withdrawAll(): Promise<void> {
    // TODO(loris): Replace with "withdrawAll" when available on Bundlr.
    const bundlr = await this.bundlr();
    const balance = await bundlr.getLoadedBalance();
    const minimumBalance = new BigNumber(5000);

    if (balance.isLessThan(minimumBalance)) {
      return;
    }

    const balanceToWithdraw = balance.minus(minimumBalance);
    await this.withdraw(bigNumberToAmount(balanceToWithdraw));
  }

  async withdraw(amount: Amount): Promise<void> {
    const bundlr = await this.bundlr();

    const { status } = await bundlr.withdrawBalance(amountToBigNumber(amount));

    if (status >= 300) {
      throw new BundlrWithdrawError(status);
    }
  }

  async bundlr(): Promise<WebBundlr | NodeBundlr> {
    if (this._bundlr) {
      return this._bundlr;
    }

    return (this._bundlr = await this.initBundlr());
  }

  async initBundlr(): Promise<WebBundlr | NodeBundlr> {
    const currency = 'solana';
    const address = this._options?.address ?? 'https://node1.bundlr.network';
    const options = {
      timeout: this._options.timeout,
      providerUrl: this._options.providerUrl,
    };

    const identity = this._metaplex.identity();
    const identityIsKeypair = identity.hasSecretKey();
    const bundlr = identityIsKeypair
      ? this.initNodeBundlr(address, currency, identity, options)
      : await this.initWebBundlr(address, currency, identity, options);

    try {
      // Check for valid bundlr node.
      await bundlr.utils.getBundlerAddress(currency);
    } catch (error) {
      throw new FailedToConnectToBundlrAddressError(address, error as Error);
    }

    return bundlr;
  }

  initNodeBundlr(
    address: string,
    currency: string,
    identity: KeypairSigner,
    options: any
  ): NodeBundlr {
    return new BundlrPackage.default(
      address,
      currency,
      identity.secretKey,
      options
    );
  }

  async initWebBundlr(
    address: string,
    currency: string,
    identity: IdentitySigner,
    options: any
  ): Promise<WebBundlr> {
    const wallet: BundlrWalletAdapter = {
      ...identity,
      sendTransaction: (
        transaction: Transaction,
        connection: Connection,
        options: SendOptions & { signers?: Web3Signer[] } = {}
      ): Promise<TransactionSignature> => {
        const { signers, ...sendOptions } = options;

        if ('rpc' in this._metaplex) {
          return this._metaplex
            .rpc()
            .sendTransaction(transaction, signers, sendOptions);
        }

        return connection.sendTransaction(
          transaction,
          signers ?? [],
          sendOptions
        );
      },
    };

    const bundlr = new BundlrPackage.WebBundlr(
      address,
      currency,
      wallet,
      options
    );

    try {
      // Try to initiate bundlr.
      await bundlr.ready();
    } catch (error) {
      throw new FailedToInitializeBundlrError(error as Error);
    }

    return bundlr;
  }
}

export const isBundlrStorageDriver = (
  storageDriver: StorageDriver
): storageDriver is BundlrStorageDriver => {
  return (
    'bundlr' in storageDriver &&
    'getBalance' in storageDriver &&
    'fund' in storageDriver &&
    'withdrawAll' in storageDriver
  );
};

const bigNumberToAmount = (bigNumber: BigNumber): Amount => {
  return lamports(new BN(bigNumber.decimalPlaces(0).toString()));
};

const amountToBigNumber = (amount: Amount): BigNumber => {
  return new BigNumber(amount.basisPoints.toString());
};

const getMetaplexFileTagsWithContentType = (
  file: MetaplexFile
): MetaplexFileTag[] => {
  if (!file.contentType) {
    return file.tags;
  }

  return [{ name: 'Content-Type', value: file.contentType }, ...file.tags];
};
