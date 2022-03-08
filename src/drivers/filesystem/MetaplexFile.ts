import { Buffer } from 'buffer';

export class MetaplexFile {
  public readonly buffer: Buffer;

  constructor(content: string | Buffer | Uint8Array | ArrayBuffer) {
    this.buffer = MetaplexFile.parseContent(content);
  }

  protected static parseContent(content: string | Buffer | Uint8Array | ArrayBuffer) {
    if (content instanceof ArrayBuffer) {
      return Buffer.from(new Uint8Array(content));
    }

    return Buffer.from(content);
  }

  toBuffer() {
    return this.buffer;
  }
}
