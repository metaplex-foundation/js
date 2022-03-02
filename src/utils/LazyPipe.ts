type ArrayElement<ArrayType extends readonly unknown[]> = 
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

export class LazyPipe<T> {
  protected readonly value: () => Promise<T>;

  constructor(value: () => Promise<T>) {
    this.value = value;
  }

  static make<T>(value: () => Promise<T>) {
    return new this(value);
  }

  pipe<U>(callback: (value: T) => U): LazyPipe<U> {
    return LazyPipe.make(async () => callback(await this.value()));
  }

  tap(callback: (value: T) => unknown): LazyPipe<T> {
    return LazyPipe.make(async () => {
      const value = await this.value();
      callback(value);

      return value;
    });
  }

  log(): LazyPipe<T> {
    return this.tap(v => console.log(v));
  }

  map<T extends readonly unknown[], U>(
    this: LazyPipe<ArrayElement<T>[]>,
    callback: (item: ArrayElement<T>, index: number, array: ArrayElement<T>[]) => U,
  ): LazyPipe<U[]> {
    return this.pipe(t => t.map(callback));
  }

  filter<T extends readonly unknown[]>(
    this: LazyPipe<ArrayElement<T>[]>,
    callback: (item: ArrayElement<T>, index: number, array: ArrayElement<T>[]) => unknown,
  ): LazyPipe<ArrayElement<T>[]> {
    return this.pipe(t => t.filter(callback));
  }

  async run(): Promise<T> {
    return this.value();
  }
}
