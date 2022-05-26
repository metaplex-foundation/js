import { Buffer } from 'buffer';
import { getContentType, getExtension, randomStr } from '@/utils';
import { InvalidJsonVariableError } from '@/errors';

export type MetaplexFile = Readonly<{
  buffer: Buffer;
  fileName: string;
  displayName: string;
  uniqueName: string;
  contentType: string | null;
  extension: string | null;
  tags: MetaplexFileTag[];

  getTagsWithContentType(): MetaplexFileTag[];
  getBytes(): number;
  toBuffer(): Buffer;
  toString(): string;
  toGlobalFile(): File;
}>;

export type MetaplexFileContent = string | Buffer | Uint8Array | ArrayBuffer;

export type MetaplexFileTag = { name: string; value: string };

export type MetaplexFileOptions = {
  displayName?: string;
  uniqueName?: string;
  contentType?: string;
  extension?: string;
  tags?: { name: string; value: string }[];
};

export const useMetaplexFile = (
  content: MetaplexFileContent,
  fileName: string,
  options: MetaplexFileOptions = {}
): MetaplexFile => ({
  buffer: parseMetaplexFileContent(content),
  fileName: fileName,
  displayName: options.displayName ?? fileName,
  uniqueName: options.uniqueName ?? randomStr(),
  contentType: options.contentType ?? getContentType(fileName),
  extension: options.extension ?? getExtension(fileName),
  tags: options.tags ?? [],

  getTagsWithContentType(): MetaplexFileTag[] {
    if (!this.contentType) {
      return this.tags;
    }

    return [{ name: 'Content-Type', value: this.contentType }, ...this.tags];
  },

  getBytes(): number {
    return this.buffer.byteLength;
  },

  toBuffer(): Buffer {
    return this.buffer;
  },

  toString(): string {
    return this.buffer.toString();
  },

  toGlobalFile(): File {
    return new File([this.buffer as BlobPart], this.fileName);
  },
});

export const useMetaplexFileFromBrowser = async (
  file: File,
  options: MetaplexFileOptions = {}
): Promise<MetaplexFile> => {
  const buffer = await file.arrayBuffer();

  return useMetaplexFile(buffer, file.name, options);
};

export const useMetaplexFileFromJson = <T extends object = object>(
  json: T,
  fileName: string = 'inline.json',
  options: MetaplexFileOptions = {}
): MetaplexFile => {
  let jsonString;

  try {
    jsonString = JSON.stringify(json);
  } catch (error) {
    throw new InvalidJsonVariableError(error as Error);
  }

  return useMetaplexFile(jsonString, fileName, options);
};

export const parseMetaplexFileContent = (
  content: MetaplexFileContent
): Buffer => {
  if (content instanceof ArrayBuffer) {
    return Buffer.from(new Uint8Array(content));
  }

  return Buffer.from(content);
};
