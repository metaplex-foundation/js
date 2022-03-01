export class File {
  public readonly content: string | Buffer;

  constructor(content: string | Buffer) {
    this.content = content;
  }
}
