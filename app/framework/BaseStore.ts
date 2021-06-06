/* eslint-disable no-void */
import WS from 'ws';
import Debug from 'debug';
import { v4 as uuid } from 'uuid';
import { JsonObject } from 'type-fest';
// import * as R from 'ramda';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  ActionWithPayload,
  ApiCallType,
  WssCallType,
  ApiCallWithConfig,
  WssCallWithConfig
} from './types';
import { TWsCb, IToken } from '../types';
import { put, takeLatest, call, fork, take } from 'redux-saga/effects';
import { eventChannel } from 'redux-saga';

import { isApiType, isWssType, connection } from './utils';
import { EventType } from '../common/enums/socket-event.type';
import invariant from './invariant';
import SagaRunner from './SagaRunner';
// import config from '../config/env';
import { DEBUG } from '@env';

const debug = Debug('framework:BaseStore::');
const error = Debug('framework:BaseStore:connect:error:');
debug.enabled = DEBUG || true;
error.enabled = DEBUG || true;

interface IWebSocketConfig {
  wssUrl: string;
}

type BaseStoreStaticConfig = {
  axiosConfig?: AxiosRequestConfig,
  webSocketConfig?: IWebSocketConfig
};

type BaseStoreConfig = {
  sagaRunner?: SagaRunner;
};

interface BaseRecord {
  readonly key: Readonly<string>
}

export default class BaseStore {
  public static initialized = false;
  public static sagaRunner: SagaRunner;
  public static http: AxiosInstance;
  public static wss: WebSocket;
  public static socketReady = false;
  public static wssUrl: string;
  private static ping: NodeJS.Timer;



  public http: AxiosInstance;
  public sagaRunner: SagaRunner;
  public wss: WebSocket;
  public connectWss: (arg: any) => Promise<void>;

  public static init(baseStoreConfig?: BaseStoreStaticConfig) {
    BaseStore.http = axios.create(baseStoreConfig && baseStoreConfig.axiosConfig);
    BaseStore.sagaRunner = new SagaRunner();
    BaseStore.initialized = true;
    BaseStore.wssUrl = baseStoreConfig && baseStoreConfig.webSocketConfig?.wssUrl;
  }

  public static reset() {
    BaseStore.http = void 0;
    BaseStore.sagaRunner = void 0;
    BaseStore.initialized = false;
    BaseStore.wss = void 0;
  }

  public static async connectWss({ token }: IToken): Promise<void> {
    try {
    debug('connectWss:token:: ', token);
    debug('connectWss:wssUrl:: ', BaseStore.wssUrl);
    debug('connectWss:wss:: ', BaseStore.wss);

    BaseStore.wss = new WebSocket(BaseStore.wssUrl, null, {
        headers: {
          "X-Amz-Security-Token": token,
        }
      });
    BaseStore.socketReady = await connection(BaseStore.wss);
    debug('connectWss:open:: ', BaseStore.socketReady);

    if (!BaseStore.socketReady) {
      throw new Error("aws wss failed");
    }

    BaseStore.ping = setInterval(() => BaseStore.sendData(), 15000);
    return;
   }
   catch (e) {
     console.error('connectWss:e', e);
   }
  };

  private static subscribeSocketChannel(token: string, instance: string) {
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
      const errorHandler = (errorEvent: WS.ErrorEvent) => {
        error('subscribeSocketChannel:errorHandler: ', errorEvent.message);
        BaseStore.wss.close();
        // create an Error object and put it into the channel
        emit(new Error(errorEvent.message));
      };

      const closeHandler = (e: any) => {
          debug.log(e, 'Socket is closed.');
          clearInterval(BaseStore.ping);
          (async () => {
          BaseStore.wss = void 0;
          if (BaseStore.socketReady) {
            await BaseStore.connectWss({ token });
          }
        })()
      }
      // setup the subscription
      // socket.on('ping', pingHandler);
      BaseStore.wss.onerror = errorHandler;
      BaseStore.wss.onclose = closeHandler;
      BaseStore.wss.onmessage = handler;
      // BaseStore.wss.on(instance, handler);

      return () => {
        // socket.off('ping', pingHandler);
        BaseStore.socketReady = false;
        BaseStore.wss.onclose({});
      };
    });
  }

  private static * readWss(event: string,  token: string, type: WssCallType, callback: TWsCb) {
    const socketChannel = yield call(BaseStore.subscribeSocketChannel, token, event);
    while (true) {
      const { data, status, message } = yield take(socketChannel);
      debug(`read:logged_${type}:status:`, status);
      debug(`read:logged_${type}:date:`, data);
      const feedback = callback(type, status, data, message);
      debug(`read:logged_${type}:feedback:`, feedback);
      yield put(feedback);
    }
  }

  private static sendData(message: JsonObject = { action: 'PING' }): void {
    BaseStore.wss!.send(JSON.stringify({
        ...message,
        nonce: uuid(),
    }));
}

  private static * writeWss<T extends BaseRecord>(type: WssCallType, callback: TWsCb, data: T) {
    // const pred = BaseStore.wss.readyState;
    // debug('writeWss::', pred);
    const { key } = data;
        // debug('runSaga:ws::', BaseStore.wss);
   //  const msg = JSON.stringify({ action: key, [key]: data[key] });
    debug(`write:logged_${type}:feedback:key::`, key);
    BaseStore.sendData({ action: key, [key]: data[key] })
    // BaseStore.wss.send(msg);
    const feedback = callback(type, 1, 'Ok', null);
    debug(`write:logged_${type}:feedback:`, feedback);
    yield put(feedback);
  }

  private static checkInstance(type: WssCallType, status: number, data: any, message: Error | string): any {
    return status
      ? ({ type: type.SUCCESS, payload: data })
      : ({ type: type.FAILURE, payload: message })
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
    this.wss = BaseStore.wss;
    this.sagaRunner = baseStoreConfig.sagaRunner || BaseStore.sagaRunner;
    this.connectWss = BaseStore.connectWss;
    this.sagaRunner.registerStore(key, this);

    this.dispatch = this.dispatch.bind(this);
    this.runSaga = this.runSaga.bind(this);

    this.processDecoratedMethods();

  }

  public dispatch(action: ActionWithPayload) {
    debug('dispatch::', action);
    return this.sagaRunner.dispatch(action);
  }

  public runSaga(saga: () => Iterator<any>) {
    return this.sagaRunner.runSaga(saga);
  }

  private processDecoratedMethods() {
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
      const $wssCallWith = this[i].$wssCallWith;
      if (this[i].$bind) {
        this[i] = this[i].bind(this);
      }

      if ($apiCallWith) {
        this.runCallApiWithSaga(i, $apiCallWith);
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
    debug('runCallWssWithSaga:func::', func);
    debug('runCallWssWithSaga:funcName::', funcName);

    this.runSaga(function* () {
      yield takeLatest(wssCallType.REQUEST,
        function* <T extends BaseRecord>({ payload }: ActionWithPayload<{ token: string, type: EventType, data?: T }>) {
        try {
          yield call(func, payload);
          const { type: event, data, token } = payload;
          // debug('runSaga:event::', event);
          // debug('runSaga:ws::', BaseStore.wss);
          if (event === EventType.MESSAGE) {
            yield fork(BaseStore.writeWss,  wssCallType, BaseStore.checkInstance, data);
          } else {
            yield call(BaseStore.readWss,  event, token, wssCallType, BaseStore.checkInstance);
          }
        } catch (err) {
          console.error(err);

          yield put({ type: wssCallType.FAILURE, payload: err });
        }
      });
    });
  }

  private runCallApiWithSaga(funcName: string, apiCallWithConfig: ApiCallWithConfig) {
    debug('runCallApiWithSaga:funcName::', funcName);
    const func = this[funcName];
    const { apiCallTypeName } = apiCallWithConfig;
    // try get instance type first
    const apiCallType: ApiCallType = this[apiCallTypeName] || this.constructor[apiCallTypeName];
    debug('runCallApiWithSaga::', this[apiCallTypeName]);
    debug('runCallApiWithSaga:constructor::', this.constructor[apiCallTypeName]);
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
