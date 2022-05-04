import NodeBundlr, { WebBundlr } from '@bundlr-network/client';
import BigNumber from 'bignumber.js';
import { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/MetaplexPlugin';
import { StorageDriver } from './StorageDriver';
import { MetaplexFile } from '../filesystem/MetaplexFile';
import { KeypairIdentityDriver } from '../identity/KeypairIdentityDriver';
import { planUploadMetadataOperation } from '@/modules';
import { planUploadMetadataUsingBundlrOperationHandler } from './planUploadMetadataUsingBundlrOperationHandler';
import { SolAmount } from '@/shared';
import {
  AssetUploadFailedError,
  BundlrWithdrawError,
  FailedToConnectToBundlrAddressError,
  FailedToInitializeBundlrError,
} from '@/errors';

export interface BundlrOptions {
  address?: string;
  timeout?: number;
  providerUrl?: string;
  priceMultiplier?: number;
  withdrawAfterUploading?: boolean;
}

export const bundlrStorage = (options: BundlrOptions = {}): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.setStorageDriver(new BundlrStorageDriver(metaplex, options));
    metaplex
      .operations()
      .register(planUploadMetadataOperation, planUploadMetadataUsingBundlrOperationHandler);
  },
});

export class BundlrStorageDriver extends StorageDriver {
  protected bundlr: WebBundlr | NodeBundlr | null = null;
  protected options: BundlrOptions;
  protected shouldWithdrawAfterUploading: boolean;

  constructor(metaplex: Metaplex, options: BundlrOptions = {}) {
    super(metaplex);
    this.options = {
      providerUrl: metaplex.connection.rpcEndpoint,
      ...options,
    };
    this.shouldWithdrawAfterUploading = options.withdrawAfterUploading ?? true;
  }

  public async getBalance(): Promise<SolAmount> {
    const bundlr = await this.getBundlr();
    const balance = await bundlr.getLoadedBalance();

    return SolAmount.fromLamports(balance);
  }

  public async getPrice(...files: MetaplexFile[]): Promise<SolAmount> {
    const price = await this.getMultipliedPrice(this.getBytes(files));

    return SolAmount.fromLamports(price);
  }

  public async upload(file: MetaplexFile): Promise<string> {
    const [uri] = await this.uploadAll([file]);

    return uri;
  }

  public async uploadAll(files: MetaplexFile[]): Promise<string[]> {
    await this.fund(files);
    const promises = files.map((file) => this.uploadFile(file));

    const uris = await Promise.all(promises);

    if (this.shouldWithdrawAfterUploading) {
      await this.withdrawAll();
    }

    return uris;
  }

  public async fundingNeeded(
    filesOrBytes: MetaplexFile[] | number,
    skipBalanceCheck = false
  ): Promise<BigNumber> {
    const price = await this.getMultipliedPrice(this.getBytes(filesOrBytes));

    if (skipBalanceCheck) {
      return price;
    }

    const bundlr = await this.getBundlr();
    const balance = await bundlr.getLoadedBalance();

    return price.isGreaterThan(balance) ? price.minus(balance) : new BigNumber(0);
  }

  public async needsFunding(
    filesOrBytes: MetaplexFile[] | number,
    skipBalanceCheck = false
  ): Promise<boolean> {
    const fundingNeeded = await this.fundingNeeded(filesOrBytes, skipBalanceCheck);

    return fundingNeeded.isGreaterThan(0);
  }

  public async fund(
    filesOrBytes: MetaplexFile[] | number,
    skipBalanceCheck = false
  ): Promise<void> {
    const bundlr = await this.getBundlr();
    const fundingNeeded = await this.fundingNeeded(filesOrBytes, skipBalanceCheck);

    if (!fundingNeeded.isGreaterThan(0)) {
      return;
    }

    // TODO: Catch errors and wrap in BundlrErrors.
    await bundlr.fund(fundingNeeded);
  }

  protected getBytes(filesOrBytes: MetaplexFile[] | number): number {
    if (typeof filesOrBytes === 'number') {
      return filesOrBytes;
    }

    return filesOrBytes.reduce((total, file) => total + file.getBytes(), 0);
  }

  protected async getMultipliedPrice(bytes: number): Promise<BigNumber> {
    const bundlr = await this.getBundlr();
    const price = await bundlr.getPrice(bytes);

    return price.multipliedBy(this.options.priceMultiplier ?? 1.5).decimalPlaces(0);
  }

  protected async uploadFile(file: MetaplexFile): Promise<string> {
    const bundlr = await this.getBundlr();
    const { status, data } = await bundlr.uploader.upload(
      file.toBuffer(),
      file.getTagsWithContentType()
    );

    if (status >= 300) {
      throw new AssetUploadFailedError(status);
    }

    return `https://arweave.net/${data.id}`;
  }

  protected async withdrawAll(): Promise<void> {
    // TODO(loris): Replace with "withdrawAll" when available on Bundlr.
    const balance = await this.getBalance();
    const minimumBalance = SolAmount.fromLamports(5000);

    if (balance.isLessThan(minimumBalance)) {
      return;
    }

    const balanceToWithdraw = balance.minus(minimumBalance).getLamports();
    await this.withdraw(balanceToWithdraw);
  }

  public async withdraw(lamports: BigNumber | number): Promise<void> {
    const bundlr = await this.getBundlr();

    const { status } = await bundlr.withdrawBalance(new BigNumber(lamports));

    if (status >= 300) {
      throw new BundlrWithdrawError(status);
    }
  }

  public withdrawAfterUploading() {
    this.shouldWithdrawAfterUploading = true;

    return this;
  }

  public dontWithdrawAfterUploading() {
    this.shouldWithdrawAfterUploading = false;

    return this;
  }

  public async getBundlr(): Promise<WebBundlr | NodeBundlr> {
    if (this.bundlr) return this.bundlr;

    const currency = 'solana';
    const address = this.options?.address ?? 'https://node1.bundlr.network';
    const options = {
      timeout: this.options.timeout,
      providerUrl: this.options.providerUrl,
    };

    const identity = this.metaplex.identity();
    const bundlr =
      identity instanceof KeypairIdentityDriver
        ? new NodeBundlr(address, currency, identity.keypair.secretKey, options)
        : new WebBundlr(address, currency, identity, options);

    try {
      // Check for valid bundlr node.
      await bundlr.utils.getBundlerAddress(currency);
    } catch (error) {
      throw new FailedToConnectToBundlrAddressError(address, error as Error);
    }

    if (bundlr instanceof WebBundlr) {
      try {
        // Try to initiate bundlr.
        await bundlr.ready();
      } catch (error) {
        throw new FailedToInitializeBundlrError(error as Error);
      }
    }

    this.bundlr = bundlr;

    return bundlr;
  }
}
