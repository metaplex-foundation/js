import Arweave from 'arweave';
import { StorageDriver, File } from "@/drivers";
import { Metaplex } from "@/Metaplex";

export class ArweaveStorageDriver extends StorageDriver {
  protected arweave: Arweave;

  constructor(metaplex: Metaplex, arweave?: Arweave) {
    super(metaplex);
    this.arweave = arweave ?? Arweave.init({});
  }

  async upload(content: string | Buffer | File): Promise<string> {
    if (content instanceof File) {
      content = content.content;
    }

    const transaction = await this.arweave.createTransaction({ data: content });

    // TODO: Support tags.
    // transaction.addTag('Content-Type', 'image/png');

    // TODO: Sign transaction manually using identity.
    // await this.arweave.transactions.sign(transaction, jwk???);

    const { status } = await this.arweave.transactions.post(transaction);

    if (status >= 300) {
      // TODO: Custom errors.
      throw new Error('Arweave upload failed.');
    }

    return this.getUrl(transaction.id);
  }

  protected getUrl(suffix: string) {
    const config = this.arweave.api.getConfig();
    const implicitPort =
      (config.protocol === 'http' && config.port === 80) ||
      (config.protocol === 'https' && config.port === 443);

    return implicitPort
      ? `${config.protocol}://${config.host}/${suffix}`
      : `${config.protocol}://${config.host}:${config.port}/${suffix}`;
  }
}
