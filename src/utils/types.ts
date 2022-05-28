export type Optional<T extends object, K extends keyof T = keyof T> = Omit<
  T,
  K
> &
  Partial<Pick<T, K>>;

export type Opaque<T, K> = T & { __opaque__: K };
