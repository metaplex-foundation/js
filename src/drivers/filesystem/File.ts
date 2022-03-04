import { Buffer } from 'buffer';

export class File {
  public readonly content: string | Buffer;

  constructor(content: string | Buffer) {
    this.content = content;
  }

  toBuffer() {
    return Buffer.from(this.content);
  }
}
