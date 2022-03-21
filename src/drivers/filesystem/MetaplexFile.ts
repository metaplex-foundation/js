import { Buffer } from 'buffer';
import { getContentType, getExtension, randomStr } from '@/utils';

export interface MetaplexFileOptions {
  displayName?: string;
  uniqueName?: string;
  contentType?: string;
  extension?: string;
  tags?: { name: string, value: string }[];
}

export class MetaplexFile {
  public readonly buffer: Buffer;
  public readonly fileName: string;
  public readonly displayName: string;
  public readonly uniqueName: string;
  public readonly contentType: string | null;
  public readonly extension: string | null;
  public readonly tags: { name: string, value: string }[];

  constructor(content: string | Buffer | Uint8Array | ArrayBuffer, fileName: string, options: MetaplexFileOptions = {}) {
    this.buffer = MetaplexFile.parseContent(content);
    this.fileName = fileName;
    this.displayName = options.displayName ?? fileName;
    this.uniqueName = options.uniqueName ?? randomStr();
    this.contentType = options.contentType ?? getContentType(fileName);
    this.extension = options.extension ?? getExtension(fileName);
    this.tags = options.tags ?? [];
  }

  static async fromFile(file: File, options: MetaplexFileOptions = {}) {
    const buffer = await file.arrayBuffer();

    return new this(buffer, file.name, options);
  }

  protected static parseContent(content: string | Buffer | Uint8Array | ArrayBuffer) {
    if (content instanceof ArrayBuffer) {
      return Buffer.from(new Uint8Array(content));
    }

    return Buffer.from(content);
  }

  getTagsWithContentType() {
    if (! this.contentType) {
      return this.tags;
    }

    return [
      { name: 'Content-Type', value: this.contentType },
      ...this.tags,
    ];
  }

  toBuffer(): Buffer {
    return this.buffer;
  }

  toString(): string {
    return this.buffer.toString();
  }

  toGlobalFile(): File {
    return new File([this.buffer as BlobPart], this.fileName);
  }
}
