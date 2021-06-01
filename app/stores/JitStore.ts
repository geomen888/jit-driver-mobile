import WSS from 'ws';
import { observable, runInAction, ObservableMap } from 'mobx';
import { put, call, take, takeLatest, all } from 'redux-saga/effects';
import { GankType } from '../constants';
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
import { RootStore } from "../models"
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
  @wssTypeDef public static readonly GET_WSS_DRIVERS_ACTIVE_TYPE: WssCallType;

  public dataCache: ObservableMap<string, GankDataCache> = observable.map({});
  public driversCache: ObservableMap<string, JitDriverCache> = observable.map({});

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
  public connectWss({ token }: IToken): Promise<WSS> {
    debug('connectWss:token:: ', token);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self: JitStore = this;
    self.wss = new WSS('wss://6kcv5f7ko9.execute-api.eu-central-1.amazonaws.com/dev', {
      headers: {
        "X-Amz-Security-Token": token,
      }
    });
    return new Promise(resolve => {
      self.wss.on('open', function open() {
        debug('connected:wss...');

        resolve(self.wss)
      });
    });
  };

  @bind
  public *sagaMain() {
    yield all([
      takeLatest(JitStore.GET_NEXT_PAGE_DATA_OF_TYPE.PRE_REQUEST, this.handleGetPageDataOfTypePreRequest),
      takeLatest(JitStore.GET_DRIVER_LOGIN_TYPE.PRE_REQUEST, this.handleDriverLoginTypeRequest),
      takeLatest(JitStore.GET_WSS_DRIVERS_ACTIVE_TYPE.PRE_REQUEST, this.handleGetWssDriversActiveType),
    ])
  }

  @bind
  public *handleGetWssDriversActiveType({ payload }: ActionWithPayload<{ token: string; type: string }>) {
    const self: JitStore = yield this;
    const { type = 'gps', token } = payload;

    yield call<any>(runInAction, () => {
      debug('handleWssActiveDrivers:dataCache::', JSON.stringify(self.dataCache));

      if (!self.driversCache.has(type)) {
        self.driversCache.set(type, { data: [] });
      }
      self.driverCacheLoading = true;
    });
    const cache = (self.driversCache.get(type) as unknown) as { data: IDriverItem[] };

    yield put({ type: JitStore.GET_WSS_DRIVERS_ACTIVE_TYPE.REQUEST, payload: { type, token } });
    const sagaAction = yield take(JitStore.GET_WSS_DRIVERS_ACTIVE_TYPE.SUCCESS);
    const res = sagaAction.payload as JitWssResponse<IDriverItem[]>;

    yield call<any>(runInAction, () => {
      debug('handleWssActiveDrivers:res::', res);
      cache.data = cache.data.concat(res.data || []);
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
        self.driversCache.set(type, { data: [], isAuthenticated: false  });
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
  public async  apiGetPageDataOfType({ type, page }: { type: GankType, page: number }) {
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

  @wssCallWith('GET_WSS_DRIVERS_ACTIVE_TYPE')
  public async wssGetWssDriversAciveType(payload: { token: string, type: string }) {
    return this.connectWss(payload);
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
    this.dispatch({ type: JitStore.GET_WSS_DRIVERS_ACTIVE_TYPE.PRE_REQUEST, payload: { token } });
  }
}
