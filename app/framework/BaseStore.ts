/* eslint-disable no-void */
import WSS from 'ws';
import Debug from 'debug';
// import * as R from 'ramda';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  ActionWithPayload,
  ApiCallType,
  WssCallType,
  ApiCallWithConfig,
  WssCallWithConfig
} from './types';
import { TWsCb } from '../types';
import { put, takeLatest, call, fork, take } from 'redux-saga/effects';
import { eventChannel } from 'redux-saga';
import { isApiType, isWssType } from './utils';
import invariant from './invariant';
import SagaRunner from './SagaRunner';
// import config from '../config/env';
import { DEBUG } from '@env';


const debug = Debug('framework:BaseStore::');
const error = Debug('framework:BaseStore:connect:error:');
debug.enabled = DEBUG || true;
error.enabled = DEBUG || true;

type BaseStoreStaticConfig = {
  axiosConfig?: AxiosRequestConfig,
};

type BaseStoreConfig = {
  sagaRunner?: SagaRunner;
};

export default class BaseStore {
  public static initialized = false;
  public static sagaRunner: SagaRunner;
  public static http: AxiosInstance;
  public static wss: WSS;

  public http: AxiosInstance;
  public wss: WSS;
  public sagaRunner: SagaRunner;

  public static init(baseStoreConfig?: BaseStoreStaticConfig) {
    BaseStore.http = axios.create(baseStoreConfig && baseStoreConfig.axiosConfig);
    BaseStore.sagaRunner = new SagaRunner();
    BaseStore.initialized = true;
  }

  public static reset() {
    BaseStore.http = void 0;
    BaseStore.sagaRunner = void 0;
    BaseStore.initialized = false;
    BaseStore.wss = void 0;
  }

  private static subscribeSocketChannel(socket: WSS, instance: string) {
    return eventChannel((emit) => {
      const handler = (data: any) => {
        debug(`subscribeSocketChannel:data:${JSON.stringify(data)}`);
        emit(data);
      };
      debug(`subscribeSocketChannel:instance:${instance}`);
      //  const pingHandler = (event) => {
      //       // puts event payload into the channel
      //       // this allows a Saga to take this payload from the returned channel
      //       emit(event.payload);
      //     }
      const errorHandler = (errorEvent: WSS.ErrorEvent) => {
        error('subscribeSocketChannel:errorHandler: ', errorEvent.message);
        // create an Error object and put it into the channel
        emit(new Error(errorEvent.message));
      };
      // setup the subscription
      // socket.on('ping', pingHandler);
      socket.on('error', errorHandler);
      socket.on(instance, handler);

      return () => {
        // socket.off('ping', pingHandler);
        socket.off(instance, handler);
      };
    });
  }

  private static * readWss(socket: WSS, event: string, type: WssCallType, callback: TWsCb) {
    const socketChannel = yield call(this.subscribeSocketChannel, socket, event);
    while (true) {
      const { data, status, message } = yield take(socketChannel);
      debug(`read:logged_${type}:status:`, status);
      debug(`read:logged_${type}:date:`, data);
      const feedback = callback(type, status, data, message);
      debug(`read:logged_${type}:feedback:`, feedback);
      yield put(feedback);
    }
  }

  private static checkInstance(type: WssCallType, status: number, data: any, message: Error | string): any {
    return status
      ? () => ({ type: type.FAILURE, payload: message })
      : () => ({ type: type.SUCCESS, payload: data })
  }

  constructor(public key: string, baseStoreConfig?: BaseStoreConfig) {
    if (!BaseStore.initialized) {
      BaseStore.init();
    }

    invariant(
      key !== '',
      'store.key couldn\'t be an empty string'
    );

    if (!baseStoreConfig) {
      baseStoreConfig = {};
    }

    this.http = BaseStore.http;
    this.sagaRunner = baseStoreConfig.sagaRunner || BaseStore.sagaRunner;

    this.sagaRunner.registerStore(key, this);

    this.dispatch = this.dispatch.bind(this);
    this.runSaga = this.runSaga.bind(this);

    this.processApiDecoratedMethods();
    this.processWssDecoratedMethods();
  }

  public dispatch(action: ActionWithPayload) {
    debug('dispatch::', action);
    return this.sagaRunner.dispatch(action);
  }

  public runSaga(saga: () => Iterator<any>) {
    return this.sagaRunner.runSaga(saga);
  }

  private processApiDecoratedMethods() {
    const funcNameList = Object.getOwnPropertyNames(Object.getPrototypeOf(this)).filter(
      i => {
        return (
          ['constructor'].indexOf(i) < 0 &&
          typeof this[i] === 'function'
        );
      }
    );

    funcNameList.forEach(i => {
      const $apiCallWith = this[i].$apiCallWith;
      if (this[i].$bind) {
        this[i] = this[i].bind(this);
      }
      if ($apiCallWith) {
        this.runCallApiWithSaga(i, $apiCallWith);
      }
    });
  }

  private processWssDecoratedMethods() {
    const funcNameList = Object.getOwnPropertyNames(Object.getPrototypeOf(this)).filter(
      i => {
        return (
          ['constructor'].indexOf(i) < 0 &&
          typeof this[i] === 'function'
        );
      }
    );
    debug('processWssDecoratedMethods::', funcNameList);
    funcNameList.forEach(i => {
      const $wssCallWith = this[i].$wssCallWith;
      if (this[i].$bind) {
        this[i] = this[i].bind(this);
      }
      if ($wssCallWith) {
        this.runCallWssWithSaga(i, $wssCallWith);
      }
    });
  }

  private runCallWssWithSaga(funcName: string, wssCallWithConfig: WssCallWithConfig) {
    const func = this[funcName];

    const { wssCallTypeName } = wssCallWithConfig;
    debug('runCallWssWithSaga::', this[wssCallTypeName]);
    debug('runCallWssWithSaga:constructor::', this.constructor[wssCallTypeName]);
    // try get instance type first
    const wssCallType: WssCallType = this[wssCallTypeName] || this.constructor[wssCallTypeName];

    invariant(
      isWssType(wssCallType),
      'invalid wssCallType: %s',
      JSON.stringify(wssCallType)
    );

    this.runSaga(function* () {
      yield takeLatest(wssCallType.REQUEST,
        function* ({ payload }: ActionWithPayload<{ token: string, type: string }>) {
        try {
          const wss: WSS = yield call(func, payload);
          const { type: event } = payload;
          yield fork(BaseStore.readWss, wss, event, wssCallType, BaseStore.checkInstance);
        } catch (err) {
          yield put({ type: wssCallType.FAILURE, payload: err });
          console.error(err);
        }
      });
    });
  }

  private runCallApiWithSaga(funcName: string, apiCallWithConfig: ApiCallWithConfig) {
    debug('runCallWssWithSaga:funcName::', funcName);

    const func = this[funcName];
    const { apiCallTypeName } = apiCallWithConfig;
    // try get instance type first
    const apiCallType: ApiCallType = this[apiCallTypeName] || this.constructor[apiCallTypeName];
    debug('runCallWssWithSaga::', this[apiCallTypeName]);
    debug('runCallWssWithSaga:constructor::', this.constructor[apiCallTypeName]);
    invariant(
      isApiType(apiCallType),
      'invalid apiCallType: %s',
      JSON.stringify(apiCallType)
    );

    this.runSaga(function* () {
      yield takeLatest(apiCallType.REQUEST, function* ({ payload }: ActionWithPayload) {
        try {
          const data = yield call(func, payload);
          yield put({ type: apiCallType.SUCCESS, payload: data });
        } catch (err) {
          yield put({ type: apiCallType.FAILURE, payload: err });
          console.error(err);
        }
      });
    });
  }
}
