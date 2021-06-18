import { observable, runInAction, ObservableMap, action } from 'mobx';
import { v4 as uuid } from 'uuid';
import { put, call, take, takeLatest, all } from 'redux-saga/effects';
import { EventType } from '../common/enums/socket-event.type';
import { CallStateType } from '../common/enums/ami-call.type';
import { GankType } from '../constants';
import { DriverSnapshot } from "../models/driver";

import Debug from 'debug';
import {
  GankDataCache,
  JitDriverCache,
  GankApiResponse,
  GankDataItem,
  IToken,
  IDriverItem,
  JitWssResponse
} from '../types';
import {
  BaseStore,
  apiTypeDef,
  wssTypeDef,
  bind,
  apiCallWith,
  wssCallWith
} from '../framework';
import { ApiCallType, ActionWithPayload, WssCallType } from '../framework/types';
import { RootStore, IOrderNotification } from "../models"
import { LoadingSatatus } from '../common/enums/profile-loading-status.type'

// import { connectWss } from '../services/wss';
import { DEBUG } from '@env';

const debug = Debug('JitStore::');
const error = Debug('JitStore::error:');

debug.enabled = DEBUG || false;
error.enabled = DEBUG || false;


export default class JitStore extends BaseStore {
  @apiTypeDef public static readonly GET_NEXT_PAGE_DATA_OF_TYPE: ApiCallType;
  @apiTypeDef public static readonly GET_DRIVER_LOGIN_TYPE: ApiCallType;
  @wssTypeDef public static readonly GET_DRIVERS_ACTIVE_TYPE: WssCallType;
  @wssTypeDef public static readonly SET_COORDINATES_DRIVER_TYPE: WssCallType;
  @wssTypeDef public static readonly GET_ORIGINATE_CALL_DRIVER_TYPE: WssCallType;
  @wssTypeDef public static readonly ON_CALL_STATE_DRIVER_TYPE: WssCallType;
  @wssTypeDef public static readonly ON_NOTIFICATION_DRIVER_TYPE: WssCallType;


  public dataCache: ObservableMap<string, GankDataCache> = observable.map({});
  public driversCache: ObservableMap<string, JitDriverCache | { data: IOrderNotification[] }> = observable.map({});
  public callStateCache: ObservableMap<string, CallStateType > = observable.map({});

  @observable
  public dataCacheLoading = false;

  @observable
  public driverCacheLoading = false;

  @observable
  public profileCacheLoading = false;

  constructor(public key: string, public rootStore: RootStore) {
    super(key);
    this.runSaga(this.sagaMain);

  }


  @bind
  public *sagaMain() {
    yield all([
      takeLatest(JitStore.GET_NEXT_PAGE_DATA_OF_TYPE.PRE_REQUEST, this.handleGetPageDataOfTypePreRequest),
      takeLatest(JitStore.GET_DRIVER_LOGIN_TYPE.PRE_REQUEST, this.handleDriverLoginTypeRequest),
      takeLatest(JitStore.GET_DRIVERS_ACTIVE_TYPE.PRE_REQUEST, this.handleGetWssDriversActiveType),
      takeLatest(JitStore.SET_COORDINATES_DRIVER_TYPE.PRE_REQUEST, this.handleSetWssCoordinatesDriverType),
      takeLatest(JitStore.GET_ORIGINATE_CALL_DRIVER_TYPE.PRE_REQUEST, this.handleGetWssOriginateCallDriverType),
      // takeLatest(JitStore.ON_CALL_STATE_DRIVER_TYPE.PRE_REQUEST, this.handleGetWssOriginateCallDriverType),
      takeLatest(JitStore.ON_NOTIFICATION_DRIVER_TYPE.PRE_REQUEST, this.handleGetWssNotificationDriverType),

    ])
  }

  @bind
  public *handleGetWssOriginateCallDriverType({ payload }: ActionWithPayload<{
     token: string;
     type: EventType;
     data: {
      opponentId: string;
     }
    }>) {
    try {
      const self: JitStore = yield this;
      const { type = 'call', token, data: { opponentId } } = payload;
      yield call<any>(runInAction, () => {
        debug('handleGetWssOriginateCallDriverType:callStateCache::', JSON.stringify(self.callStateCache));
        if (!self.callStateCache.has(type)) {
          self.callStateCache.set(type, CallStateType.PREPARE);
        }
      }); //

      yield put({ type: JitStore.GET_ORIGINATE_CALL_DRIVER_TYPE.REQUEST,
                  payload: { type, token, data: { call: opponentId, key: 'call' }}  });
      const sagaAction = yield take(JitStore.GET_ORIGINATE_CALL_DRIVER_TYPE.SUCCESS);
      const res = sagaAction.payload as JitWssResponse<CallStateType>;

      yield call<any>(runInAction, () => {
      debug('handleGetWssOriginateCallDriverType:res::', JSON.stringify(res));
      self.callStateCache.set(type, CallStateType.ORIGINATE);
    });
    } catch (e) {
      error('handleGetWssOriginateCallDriverType:e::', e);
    }
  }

  @bind
  public *handleSetWssCoordinatesDriverType({ payload }: ActionWithPayload<{
    token: string;
    data: { coordinates: number[] };
    type: EventType
  }>) {
    const { data: { coordinates = [] }, type = EventType.MESSAGE, token } = payload;
    // const state = yield select(state => state);
    debug('handleSetWssCoordinatesDriverType:coordinates::', coordinates);
    yield put({
      type: JitStore.SET_COORDINATES_DRIVER_TYPE.REQUEST,
      payload: { data: { coordinates, key: 'coordinates' }, token, type }
    });
    const sagaAction = yield take(JitStore.SET_COORDINATES_DRIVER_TYPE.SUCCESS);
    debug('handleSetWssCoordinatesDriverType:res::', sagaAction);
  }

  @bind
  public *handleGetWssNotificationDriverType({ payload }: ActionWithPayload<{ token: string; type: EventType }>) {
    const self: JitStore = yield this;
    const { type = EventType.NOTIFICATION, token } = payload;
    yield call<any>(runInAction, () => {
      debug('handleGetWssNotificationDriverType:dataCache::', JSON.stringify(self.dataCache));
      if (!self.driversCache.has(type)) {
        self.driversCache.set(type, { data: [] });
      }
      self.profileCacheLoading = true;
    });
    const cache = self.driversCache.get(type) as { data: IOrderNotification[] };
    debug('handleGetWssNotificationDriverType:cache.data::', JSON.stringify(cache.data));

    yield put({ type: JitStore.ON_NOTIFICATION_DRIVER_TYPE.REQUEST, payload: { type, token } });
    const sagaAction = yield take(JitStore.ON_NOTIFICATION_DRIVER_TYPE.SUCCESS);
    const res = sagaAction.payload as JitWssResponse<IOrderNotification>;

    yield call<any>(runInAction, () => {
      debug('handleGetWssNotificationDriverType:res::', res);
      //cache.data.push(res.data);
      //self.driversCache.set(type, [res.data]);
      const notification: IOrderNotification = {
        id: uuid(),
        // type: DriverNotificationType.ORDER_CONFIRMATION,
        orderId: res.data?.orderId,
        created: new Date().toISOString()
      };

      self.driversCache.set(type, { data: [notification] })

      debug('handleGetWssNotificationDriverType:notification::', notification);
      self.profileCacheLoading = false;
    });
  }

  @bind
  public *handleGetWssDriversActiveType({ payload }: ActionWithPayload<{ token: string; type: EventType }>) {
    const self: JitStore = yield this;
    const { type = EventType.COORDINATES, token } = payload;
    yield call<any>(runInAction, () => {
      debug('handleWssActiveDrivers:dataCache::', JSON.stringify(self.dataCache));
      if (!self.driversCache.has(type)) {
        self.driversCache.set(type, { data: [] });
      }
      self.driverCacheLoading = true;
    });
    const cache = (self.driversCache.get(type) as unknown) as { data: IDriverItem[] };

    yield put({ type: JitStore.GET_DRIVERS_ACTIVE_TYPE.REQUEST, payload: { type, token } });
    const sagaAction = yield take(JitStore.GET_DRIVERS_ACTIVE_TYPE.SUCCESS);
    const res = sagaAction.payload as JitWssResponse<IDriverItem[]>;

    yield call<any>(runInAction, () => {
      debug('handleWssActiveDrivers:res::', res);
      cache.data = cache.data.concat(res.data || []);
      const drivers = res.data.map(it => {
        const { coordinates: [lat, lng], id } = it;
        return ({
          id,
          lat,
          lng
        })
      }) as DriverSnapshot[];

      self.rootStore.jitStore.saveDrivers(drivers)
      self.driverCacheLoading = false;
    });
  }

  @bind
  public *handleGetPageDataOfTypePreRequest({ payload }: ActionWithPayload<{ type: GankType }>) {
    const self: JitStore = yield this;
    const { type } = payload as any;

    yield call<any>(runInAction, () => {
      debug('handleGetPageDataOfTypePreRequest:dataCache::', JSON.stringify(self.dataCache));

      if (!self.dataCache.has(type)) {
        self.dataCache.set(type, { data: [], currentPage: 0 });
      }
      self.dataCacheLoading = true;
    });
    debug('handleGetPageDataOfTypePreRequest:type::', type);

    const cache = self.dataCache.get(type);
    const nextPage = cache.currentPage + 1;

    yield put({ type: JitStore.GET_NEXT_PAGE_DATA_OF_TYPE.REQUEST, payload: { type, page: nextPage } });

    const sagaAction = yield take(JitStore.GET_NEXT_PAGE_DATA_OF_TYPE.SUCCESS);
    debug('handleGetPageDataOfTypePreRequest:sagaAction::', sagaAction);

    const res = sagaAction.payload as GankApiResponse<GankDataItem[]>;
    debug('handleGetPageDataOfTypePreRequest:sagaAction::', sagaAction);

    yield call<any>(runInAction, () => {
      debug('handleGetPageDataOfTypePreRequest:res::', res);

      cache.data = cache.data.concat(res.results);
      cache.currentPage = nextPage;

      self.dataCacheLoading = false;
    });
  }

  @bind
  public *handleDriverLoginTypeRequest({ payload }: ActionWithPayload<{ phone: string }>) {
    const self: JitStore = yield this;
    const { phone, type = 'iam' } = payload as any;

    yield call<any>(runInAction, () => {
      debug('handleDriverLoginRequest:driversCache::', JSON.stringify(self.driversCache));
      self.rootStore.jitStore.resetProfile();
      self.rootStore.jitStore.setProfileLoadingStatus(LoadingSatatus.IDLE)
      if (!self.driversCache.has(type)) {
        self.driversCache.set(type, { data: [], isAuthenticated: false });
      }
      self.profileCacheLoading = true;
    });

    debug('handleDriverLoginRequest:type::', type);
    const cache = (self.driversCache.get(type) as unknown) as { data: IToken[], isAuthenticated: boolean };

    yield put({ type: JitStore.GET_DRIVER_LOGIN_TYPE.REQUEST, payload: { phone } });

    self.rootStore.jitStore.setProfileLoadingStatus(LoadingSatatus.LOADING)
    const sagaAction = yield take(JitStore.GET_DRIVER_LOGIN_TYPE.SUCCESS);
    debug('handleDriverLoginRequest:sagaAction::', sagaAction);

    const res = sagaAction.payload as JitWssResponse<IToken>;
    debug('handleDriverLoginRequest:sagaAction::', sagaAction);

    yield call<any>(runInAction, () => {
      debug('handleDriverLoginRequest:res::', res);
      self.rootStore.jitStore.setProfileLoadingStatus(LoadingSatatus.READY)
      self.rootStore.jitStore.saveProfile({ ...res?.data, phone })
      cache.data = cache.data.concat(res.data);
      cache.isAuthenticated = true;
      self.driversCache.set('iam', { data: cache.data, isAuthenticated: true })
      self.profileCacheLoading = false;
    });
  }

  @apiCallWith('GET_NEXT_PAGE_DATA_OF_TYPE')
  public async apiGetPageDataOfType({ type, page }: { type: GankType, page: number }) {
    const res = await this.http.get(`/data/${type}/10/${page}`);
    return res.data as GankApiResponse<GankDataItem[]>;
  }

  @apiCallWith('GET_DRIVER_LOGIN_TYPE')
  public async apiGetDriverLoginType({ phone }: { phone: string }) {
    debug('apiGetDriverLoginType:phone::', phone)

    const res = await this.http.post('driver/signin', {
      phone
    })
      .then(result => result.data as JitWssResponse<IToken[]>);
    return res;
  }

  @wssCallWith('GET_ORIGINATE_CALL_DRIVER_TYPE')
  public async wssGetOriginateCallDriverType(payload: {
     token: string,
     data: any,
     type: EventType
     }) {

    await this.connectWss(payload);

    return this.wss;
  }

  @wssCallWith('GET_DRIVERS_ACTIVE_TYPE')
  public async wssGetWssDriversActiveType(payload: { token: string, type: EventType }) {
    await this.connectWss(payload);

    return this.wss;
  }

  @wssCallWith('ON_NOTIFICATION_DRIVER_TYPE')
  public async wssGetWssNotificationDriversType(payload: { token: string, type: EventType }) {
    await this.connectWss(payload);

    return this.wss;
  }


  @wssCallWith('SET_COORDINATES_DRIVER_TYPE')
  public async wssSetCoordinatesDriverType(payload: { token: string, data: any, type: EventType }) {
    await this.connectWss(payload);
    // debug('wssSetCoordinatesDriverType:: ', BaseStore.wss);
    return this.wss;
  }

  public loadNextPageOfType(type: GankType = GankType.All) {
    debug('loadNextPageOfType:type::', type)
    this.dispatch({ type: JitStore.GET_NEXT_PAGE_DATA_OF_TYPE.PRE_REQUEST, payload: { type } });
  }

  public loadDriverLoginType(phone: string) {
    debug('loadDriverLoginType:phone::', phone)
    this.dispatch({ type: JitStore.GET_DRIVER_LOGIN_TYPE.PRE_REQUEST, payload: { phone } });
  }

  public loadWssDriversActiveType(token: string) {
    this.dispatch({
      type: JitStore.GET_DRIVERS_ACTIVE_TYPE.PRE_REQUEST,
      payload: { token, type: EventType.COORDINATES }
    });
  }

  public loadWssNotificationDriversType(token: string) {
    this.dispatch({
      type: JitStore.ON_NOTIFICATION_DRIVER_TYPE.PRE_REQUEST,
      payload: { token, type: EventType.NOTIFICATION }
    });
  }

  public loadCoordinatesDriverType(token: string, data: { coordinates: number[] }) {
    debug('setCoordinatesDriverType:token::', token)
    this.dispatch({ type: JitStore.SET_COORDINATES_DRIVER_TYPE.PRE_REQUEST, payload: { token, data } });
  }

  public originateWssCallDriverType(token: string, data: { opponentId: string }) {
    this.dispatch({
      type: JitStore.GET_ORIGINATE_CALL_DRIVER_TYPE.PRE_REQUEST,
      payload: { token, type: EventType.MESSAGE, data }
    });
    // this.dispatch({
    //   type: JitStore.GET_ORIGINATE_CALL_DRIVER_TYPE.PRE_REQUEST,
    //   payload: { token, type: EventType.CALL }
    // });
  }
}
