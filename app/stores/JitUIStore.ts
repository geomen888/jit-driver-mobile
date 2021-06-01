import { computed, observable, action } from 'mobx';
import { BaseStore, bind } from '../framework';
import GankStore from './JitStore';
import { GankType } from '../constants';
import { GankDataCache, JitDriverCache } from '../types';
import { IProfile } from '../models';

export default class JitUIStore extends BaseStore {
  @observable
  public showMenu = false;

  @observable
  public isAuthenticated = false;

  @observable
  public currentType: GankType = GankType.All;

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
  get driverCache(): JitDriverCache {
    let driverCache;
    if (this.jitStore) {
      driverCache = this.jitStore.driversCache.get('iam');
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

  @action('切换干货类型')
  public switchGankType(type: GankType) {
    if (this.showMenu) {
      this.showMenu = false;
    }

    this.currentType = type;
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
  public driverLogin(phone: string) {
    return this.jitStore.loadDriverLoginType(phone);
  }

  @action('切换菜单展示或隐藏')
  public switchMenuShow(show: boolean) {
    this.showMenu = show;
  }

  constructor (public key: string, protected jitStore: GankStore) {
    super(key);
  }
}
