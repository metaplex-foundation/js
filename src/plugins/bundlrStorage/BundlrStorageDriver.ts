import type { default as NodeBundlr, WebBundlr } from '@bundlr-network/client';
import * as BundlrPackage from '@bundlr-network/client';
import BigNumber from 'bignumber.js';
import BN from 'bn.js';
import { Metaplex } from '@/Metaplex';
import { Amount, StorageDriver, useLamports } from '@/types';
import { KeypairIdentityDriver } from '../keypairIdentity';
import {
  AssetUploadFailedError,
  BundlrWithdrawError,
  FailedToConnectToBundlrAddressError,
  FailedToInitializeBundlrError,
} from '@/errors';
import { MetaplexFile } from '../storageModule';

export type BundlrStorageDriver = StorageDriver & {
  uploadAll: (files: MetaplexFile[]) => Promise<string[]>;
  getBalance: () => Promise<Amount>;
  fundingNeeded: (
    amount: Amount,
    skipBalanceCheck?: boolean
  ) => Promise<Amount>;
  fund: (amount: Amount, skipBalanceCheck?: boolean) => Promise<void>;
  withdrawAll(): Promise<void>;
  withdraw(amount: Amount): Promise<void>;
  shouldWithdrawAfterUploading(): boolean;
  withdrawAfterUploading(): BundlrStorageDriver;
  dontWithdrawAfterUploading(): BundlrStorageDriver;
};

export type BundlrOptions = {
  address?: string;
  timeout?: number;
  providerUrl?: string;
  priceMultiplier?: number;
  withdrawAfterUploading?: boolean;
};

export const useBundlrStorageDriver = (
  metaplex: Metaplex,
  options: BundlrOptions = {}
): BundlrStorageDriver => {
  let bundlr: WebBundlr | NodeBundlr | null = null;
  let _withdrawAfterUploading: boolean = options.withdrawAfterUploading ?? true;
  options = {
    providerUrl: metaplex.connection.rpcEndpoint,
    ...options,
  };

  const getBundlr = async (): Promise<WebBundlr | NodeBundlr> => {
    if (bundlr) {
      return bundlr;
    }

    return (bundlr = await initBundlr(metaplex, options));
  };

  return {
    async getUploadPrice(bytes: number): Promise<Amount> {
      const bundlr = await getBundlr();
      const price = await bundlr.getPrice(bytes);

      return bigNumberToAmount(
        price.multipliedBy(options.priceMultiplier ?? 1.5)
      );
    },

    async upload(file: MetaplexFile): Promise<string> {
      const [uri] = await this.uploadAll([file]);

      return uri;
    },

    async uploadAll(files: MetaplexFile[]): Promise<string[]> {
      const bundlr = await getBundlr();
      const amount = await this.getUploadPrice(getBytes(...files));
      await this.fund(amount);

      const promises = files.map(async (file) => {
        const { status, data } = await bundlr.uploader.upload(
          file.toBuffer(),
          file.getTagsWithContentType()
        );

        if (status >= 300) {
          throw new AssetUploadFailedError(status);
        }

        return `https://arweave.net/${data.id}`;
      });

      const uris = await Promise.all(promises);

      if (this.shouldWithdrawAfterUploading()) {
        await this.withdrawAll();
      }

      return uris;
    },

    async getBalance(): Promise<Amount> {
      const bundlr = await getBundlr();
      const balance = await bundlr.getLoadedBalance();

      return bigNumberToAmount(balance);
    },

    async fundingNeeded(
      amount: Amount,
      skipBalanceCheck = false
    ): Promise<Amount> {
      if (skipBalanceCheck) {
        return amount;
      }

      const bundlr = await getBundlr();
      const balance = await bundlr.getLoadedBalance();
      const price = amountToBigNumber(amount);
      const fundingNeeded = price.isGreaterThan(balance)
        ? price.minus(balance)
        : new BigNumber(0);

      return bigNumberToAmount(fundingNeeded);
    },

    async fund(amount: Amount, skipBalanceCheck = false): Promise<void> {
      const bundlr = await getBundlr();
      const fundingNeeded = await this.fundingNeeded(amount, skipBalanceCheck);

      if (fundingNeeded.basisPoints.lten(0)) {
        return;
      }

      // TODO: Catch errors and wrap in BundlrErrors.
      await bundlr.fund(amountToBigNumber(fundingNeeded));
    },

    async withdrawAll(): Promise<void> {
      // TODO(loris): Replace with "withdrawAll" when available on Bundlr.
      const bundlr = await getBundlr();
      const balance = await bundlr.getLoadedBalance();
      const minimumBalance = new BigNumber(5000);

      if (balance.isLessThan(minimumBalance)) {
        return;
      }

      const balanceToWithdraw = balance.minus(minimumBalance);
      await this.withdraw(bigNumberToAmount(balanceToWithdraw));
    },

    async withdraw(amount: Amount): Promise<void> {
      const bundlr = await getBundlr();

      const { status } = await bundlr.withdrawBalance(
        amountToBigNumber(amount)
      );

      if (status >= 300) {
        throw new BundlrWithdrawError(status);
      }
    },

    shouldWithdrawAfterUploading(): boolean {
      return _withdrawAfterUploading;
    },

    withdrawAfterUploading() {
      _withdrawAfterUploading = true;

      return this;
    },

    dontWithdrawAfterUploading() {
      _withdrawAfterUploading = false;

      return this;
    },
  };
};

export const isBundlrStorageDriver = (
  storageDriver: StorageDriver
): storageDriver is BundlrStorageDriver => {
  return (
    'fund' in storageDriver &&
    'withdrawAll' in storageDriver &&
    'shouldWithdrawAfterUploading' in storageDriver &&
    'withdrawAfterUploading' in storageDriver &&
    'dontWithdrawAfterUploading' in storageDriver
  );
};

const initBundlr = async (
  metaplex: Metaplex,
  options: BundlrOptions
): Promise<WebBundlr | NodeBundlr> => {
  const currency = 'solana';
  const address = options?.address ?? 'https://node1.bundlr.network';
  options = {
    timeout: options.timeout,
    providerUrl: options.providerUrl,
  };

  const identity = metaplex.identity();
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
};

const getBytes = (...files: MetaplexFile[]): number => {
  return files.reduce((acc, file) => acc + file.getBytes(), 0);
};

const bigNumberToAmount = (bigNumber: BigNumber): Amount => {
  return useLamports(new BN(bigNumber.decimalPlaces(0).toString()));
};

const amountToBigNumber = (amount: Amount): BigNumber => {
  return new BigNumber(amount.basisPoints.toString());
};
