import { Program } from '@/types';
import {
  MetaplexError,
  MetaplexErrorInputWithoutSource,
  MetaplexErrorOptions,
} from './MetaplexError';

type UnderlyingProgramError = Error & { code?: number; logs?: string[] };

/** @group Errors */
export class ProgramError extends MetaplexError {
  public program: Program;

  constructor(program: Program, input: MetaplexErrorInputWithoutSource) {
    super({
      ...input,
      key: `program.${input.key}`,
      title: `${program.name} > ${input.title}`,
      source: 'program',
      sourceDetails: `${program.name} [${program.address.toBase58()}]`,
    });
    this.program = program;
  }
}

/** @group Errors */
export class ParsedProgramError extends ProgramError {
  constructor(
    program: Program,
    cause: UnderlyingProgramError,
    options?: Omit<MetaplexErrorOptions, 'cause' | 'logs'>
  ) {
    const ofCode = cause.code ? ` of code [${cause.code}]` : '';
    super(program, {
      key: 'parsed_program_error',
      title: cause.message,
      problem:
        `The program [${program.name}] ` +
        `at address [${program.address.toBase58()}] ` +
        `raised an error${ofCode} ` +
        `that translates to "${cause.message}".`,
      solution: 'Check the error message provided by the program.',
      options: {
        ...options,
        logs: cause.logs,
        cause,
      },
    });
  }
}

/** @group Errors */
export class UnknownProgramError extends ProgramError {
  constructor(
    program: Program,
    cause: UnderlyingProgramError,
    options?: Omit<MetaplexErrorOptions, 'cause' | 'logs'>
  ) {
    const ofCode = cause.code ? ` of code [${cause.code}]` : '';
    super(program, {
      key: 'unknown_program_error',
      title: 'Unknown Program Error',
      problem:
        `The program [${
          program.name
        }] at address [${program.address.toBase58()}] ` +
        `raised an error${ofCode} that is not recognized by the programs registered by the SDK.`,
      solution:
        'Unfortunately, you will need to check the unparsed ' +
        'error below to investigate what went wrong. ' +
        'To get more helpful error messages, ensure the program that failed is ' +
        'registered by the SDK and provides an "errorResolver" method.',
      options: {
        ...options,
        logs: cause.logs,
        cause,
      },
    });
  }
}
