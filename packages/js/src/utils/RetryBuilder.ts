import { Metaplex } from '@/Metaplex';

export type RetryOptions = {
  function: (...args: any[]) => any,
  parameters?: any[],
  numRetries?: number,
  timeout?: number
};

export class RetryBuilder {
  protected fn: (...args: any[]) => any;
  protected parameters?: any[];
  protected numRetries?: number;
  protected timeout?: number;
  protected result?: any;
  protected metaplex: Metaplex;

  constructor(metaplex: Metaplex, options: RetryOptions) {
    this.fn = options.function;
    this.parameters = options.parameters;
    this.numRetries = options.numRetries ?? 20;
    this.timeout = options.timeout ?? 2000;
    this.result = null;
    this.metaplex = metaplex;
  }

  static make(metaplex: Metaplex, options: RetryOptions) {
    return new RetryBuilder(metaplex, options);
  }

  async run(): Promise<any> {
    for (let i=0;i<this.numRetries;i++) {
      try {
        this.result = await this.fn.apply(this, this.parameters);
        break;
      } catch (error) {
        await new Promise(f => setTimeout(f, this.timeout));
      }
    }
    return this;
  }

  getResult() {
    return this.result;
  }
}

