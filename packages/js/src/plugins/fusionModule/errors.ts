import { MetaplexError } from '@/errors';

/** @group Errors */
export class FusionError extends MetaplexError {
  readonly name: string = 'FusionError';
  constructor(message: string, cause?: Error) {
    super(message, 'plugin', 'Fusion', cause);
  }
}
