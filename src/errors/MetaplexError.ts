export type MetaplexErrorSource =
  | 'sdk'
  | 'network'
  | 'rpc'
  | 'plugin'
  | 'program';

export type MetaplexErrorInput = {
  key: string;
  title: string;
  problem: string;
  solution: string;
  source: MetaplexErrorSource;
  sourceDetails?: string;
  cause?: Error;
  logs?: string[];
};

export type MetaplexErrorInputWithoutSource = Omit<
  MetaplexErrorInput,
  'source' | 'sourceDetails'
>;

export class MetaplexError extends Error {
  readonly name: 'MetaplexError' = 'MetaplexError';
  readonly key: string;
  readonly title: string;
  readonly problem: string;
  readonly solution: string;
  readonly source: MetaplexErrorSource;
  readonly sourceDetails?: string;
  readonly cause?: Error;
  readonly logs?: string[];

  constructor(input: MetaplexErrorInput) {
    super(input.problem);
    this.key = `metaplex.errors.${input.key}`;
    this.title = input.title;
    this.problem = input.problem;
    this.solution = input.solution;
    this.source = input.source;
    this.sourceDetails = input.sourceDetails;
    this.cause = input.cause;
    this.logs = input.logs;
    this.message = this.toString(false);
  }

  getCapitalizedSource(): string {
    if (this.source === 'sdk' || this.source === 'rpc') {
      return this.source.toUpperCase();
    }

    return this.source[0].toUpperCase() + this.source.slice(1);
  }

  getFullSource(): string {
    const capitalizedSource = this.getCapitalizedSource();
    const sourceDetails = this.sourceDetails ? ` > ${this.sourceDetails}` : '';

    return capitalizedSource + sourceDetails;
  }

  toString(withName: boolean = true) {
    const logs =
      this.logs != null ? `\n\n[ Logs: ${this.logs.join(' |$> ')} ]` : '';
    const causedBy = this.cause ? `\n\nCaused By: ${this.cause}` : '';

    return (
      (withName ? `[${this.name}] ` : '') +
      `${this.title}` +
      `\n>> Source: ${this.getFullSource()}` +
      `\n>> Problem: ${this.problem}` +
      `\n>> Solution: ${this.solution}` +
      causedBy +
      logs +
      '\n'
    );
  }
}
