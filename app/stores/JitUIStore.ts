import { computed, observable, action, createAtom } from 'mobx';
import Debug from 'debug';
import { DEBUG } from '@env';
import JitStore from './JitStore';
import { GankType } from '../constants';
import { GankDataCache, JitDriverCache } from '../types';
import { IProfile, IOrderNotification } from '../models';
import { BaseStore, bind } from '../framework';
import { EventType } from '../common/enums/socket-event.type';

const debug = Debug('JitUIStore:');
const error = Debug('JitUIStore:error:');

debug.enabled = DEBUG || false;
error.enabled = DEBUG || false;


export default class JitUIStore extends BaseStore {
  private atom: any;
  private intervalHandler = null;
  private currentDateTime: Date;

  @observable
  public showMenu = false;

  @observable
  public orderNotification = false;

  @computed
  get getJitStore() {
    return this.jitStore
     ? this.jitStore?.rootStore
     : null
  }

  @observable
  public isAuthenticated = this.getJitStore
   ? this.getJitStore.jitStore?.isAuthenticated
   : false;

  @observable
  public currentType: GankType = GankType.All;

  @observable
  public currentEvent: EventType = EventType.MESSAGE;

  @computed
  get dataCache (): GankDataCache {
    let dataCache;
    if (this.jitStore) {
      dataCache = this.jitStore.dataCache.get(this.currentType);
    }
    if (!dataCache) {
      dataCache = { data: [], currentPage: 0 };
    }

    return dataCache;
  }

  @computed
  get dataNCache (): { data: IOrderNotification[] } {
    let dataNCache;
    if (this.jitStore) {
      const payload = this.jitStore.driversCache.get(EventType.NOTIFICATION);
      dataNCache = { data: payload?.data || [] } ;
    }
    if (!dataNCache) {
      dataNCache = { data: [] };
    }

    return dataNCache;
  }

  @computed
  get driverCache(): JitDriverCache {
    let driverCache;
    if (this.jitStore) {
      const { rootStore: { jitStore: store } } = this.jitStore;
      driverCache = store.getDriversLocations;
    }
    if (!driverCache) {
      driverCache = { data: [] };
    }

    return driverCache;
  }

  @computed
  get profileCache(): { data: Partial<IProfile> }  {
    let profileCache = { data: { token: '' } };
    if (this.jitStore) {
      const { rootStore: { jitStore: store }  } = this.jitStore;

      profileCache = { data: store.getProfile };
    }

    return profileCache;
  }

  @computed
  get data() {
    return this.driverCache.data;
  }

  @computed
  get profileLoading(): boolean {
    return this.jitStore ? this.jitStore.profileCacheLoading : false;
  }

  @computed
  get loading() {
    return this.jitStore ? this.jitStore.driverCacheLoading : false;
  }

  @action('switch-type')
  public switchGankType(type: GankType) {
    if (this.showMenu) {
      this.showMenu = false;
    }

    this.currentType = type;
  }

  @action('switch-event')
  public switchEvent(type: EventType) {

    this.currentEvent = type;
  }

  @action('auth')
  public switchAuth(type: boolean) {
    this.isAuthenticated = type;
  }

  @bind
  public loadNextPage() {
    return this.jitStore.loadNextPageOfType(this.currentType);
  }

  @bind
  public originateCallDriver(opponentId: string) {
    const { data: { token } } = this.profileCache;
    return this.jitStore.originateWssCallDriverType(token, { opponentId });
  }

  @bind
  public coordinatesDriver(coordinates: number[]) {
    const { data: { token } } =  this.profileCache;
    return this.jitStore.loadCoordinatesDriverType(token, { coordinates });
  }

  @bind
  public getAllActiveDriver() {
    const { data: { token } } =  this.profileCache;
    return this.jitStore.loadWssDriversActiveType(token);
  }

  @action('reset-order-noties')
  public resetOrderNoties(): void {
    if (this.jitStore && this.jitStore.driversCache.has(EventType.NOTIFICATION)) {
      this.jitStore.driversCache.set(EventType.NOTIFICATION, { data: [] });
    }
  }

  @bind
  public listenNotificationDriver() {
    const { data: { token } } =  this.profileCache;
    return this.jitStore.loadWssNotificationDriversType(token);
  }

  @bind
  public driverLogin(phone: string) {
    return this.jitStore.loadDriverLoginType(phone);
  }

  @action('切换菜单展示或隐藏')
  public switchMenuShow(show: boolean) {
    this.showMenu = show;
  }

  @action('tick')
public tick() {
    this.currentDateTime = new Date()
    this.atom.reportChanged() // Let MobX know that this data source has changed.
}

  @action('start-tick')
public startTicking() {
    this.tick() // Initial tick.
    this.intervalHandler = setInterval(() => this.tick(), 1000)
}

  @action('stop-tick')
public stopTicking() {
    clearInterval(this.intervalHandler)
    this.intervalHandler = null
}

  @action('get-time')
  public getTime() {
  // Let MobX know this observable data source has been used.
  //
  // reportObserved will return true if the atom is currently being observed
  // by some reaction. If needed, it will also trigger the startTicking
  // onBecomeObserved event handler.
  if (this.atom.reportObserved()) {
      return this.currentDateTime
  } else {
      // getTime was called, but not while a reaction was running, hence
      // nobody depends on this value, and the startTicking onBecomeObserved
      // handler won't be fired.
      //
      // Depending on the nature of your atom it might behave differently
      // in such circumstances, like throwing an error, returning a default
      // value, etc.
      return new Date()
  }
}

  constructor (public key: string, protected jitStore: JitStore) {
    super(key);
    this.atom = createAtom(
      // 1st parameter:
      // - Atom's name, for debugging purposes.
      "Clock",
      // 2nd (optional) parameter:
      // - Callback for when this atom transitions from unobserved to observed.
      () => this.startTicking(),
      // 3rd (optional) parameter:
      // - Callback for when this atom transitions from observed to unobserved.
      () => this.stopTicking()
      // The same atom transitions between these two states multiple times.
  )
  }
}
