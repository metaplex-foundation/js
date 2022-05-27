import type { default as NodeBundlr, WebBundlr } from '@bundlr-network/client';
import * as BundlrPackage from '@bundlr-network/client';
import BigNumber from 'bignumber.js';
import BN from 'bn.js';
import { Metaplex } from '@/Metaplex';
import { Amount, lamports } from '@/types';
import { KeypairIdentityDriver } from '../keypairIdentity';
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

export type BundlrOptions = {
  address?: string;
  timeout?: number;
  providerUrl?: string;
  priceMultiplier?: number;
  withdrawAfterUploading?: boolean;
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
    const bundlr =
      identity instanceof KeypairIdentityDriver
        ? new BundlrPackage.default(
            address,
            currency,
            identity.keypair.secretKey,
            options
          )
        : new BundlrPackage.WebBundlr(address, currency, identity, options);

    try {
      // Check for valid bundlr node.
      await bundlr.utils.getBundlerAddress(currency);
    } catch (error) {
      throw new FailedToConnectToBundlrAddressError(address, error as Error);
    }

    if (bundlr instanceof BundlrPackage.WebBundlr) {
      try {
        // Try to initiate bundlr.
        await bundlr.ready();
      } catch (error) {
        throw new FailedToInitializeBundlrError(error as Error);
      }
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
