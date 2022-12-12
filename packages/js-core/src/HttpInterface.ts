import type { GenericAbortSignal } from './GenericAbortSignal';

export interface HttpInterface {
  send: <ResponseData, RequestData = any>(
    method: HttpMethod,
    url: string,
    options?: HttpOptions<RequestData>
  ) => Promise<HttpResponse<ResponseData>>;
}

export type HttpOptions<RequestData = any> = {
  data?: RequestData;
  params?: any;
  headers?: HttpHeaders;
  timeout?: number;
  signal?: GenericAbortSignal;
};

export type HttpResponse<ResponseData = any> = {
  data: ResponseData;
  status: number;
  statusText: string;
  headers: HttpHeaders;
};

export type HttpHeaders = Record<string, string>;

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  HEAD = 'HEAD',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  OPTIONS = 'OPTIONS',
  CONNECT = 'CONNECT',
  TRACE = 'TRACE',
}
