export interface ApiCallType {
  PRE_REQUEST?: string;
  REQUEST: string;
  SUCCESS: string;
  FAILURE: string;
}

export interface WssCallType {
  PRE_REQUEST?: string;
  REQUEST: string;
  SUCCESS: string;
  FAILURE: string;
}

export interface ApiCallWithConfig {
  apiCallTypeName?: string;
}

export interface WssCallWithConfig {
  wssCallTypeName?: string;
}

export interface ActionWithPayload<T = any> {
  type: string;
  payload?: T;
  // [name: string]: any;
}
