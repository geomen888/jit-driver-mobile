import { GankType } from './constants';
import {
  WssCallType,
} from './framework/types';

export interface GankDataCache {
  data: GankDataItem[];
  currentPage: number;
}

export interface JitDriverCache {
  data: IDriverItem[];
}

export interface GankApiResponse<T> {
  category?: GankType[];
  error: boolean;
  results: T;
}

export interface JitWssResponse<T> {
  status: number;
  message?: Error | string;
  data?: T;
}

export type ImageUrl = string;
export type DateString = string;

export interface GankDataItem {
  _id: string;
  who: string;
  used: boolean;
  url: string;
  desc: string;
  type: GankType;
  images: ImageUrl[];
  source: string;
  createdAt: DateString;
  publishedAt: DateString;
}

export interface IDriverItem {
  _id: string;
  location: number[];
  phone: string;
  reg: string;
  name: string;
  createdAt: DateString;
  publishedAt: DateString;
}

export interface IToken {
  token: string;
}

interface ISagaPayl<T = string> {
  type: T;
  payload: any;
}

export type TWsCb = (arg1: WssCallType, arg2: number, arg3: any, arg4: Error | string) => ISagaPayl;