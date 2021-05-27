import { computed, observable, action } from 'mobx';
import { BaseStore, bind } from '../framework';
import GankStore from './GankStore';
import { GankType } from '../constants';
import { GankDataCache, JitDriverCache } from '../types';

export default class JitUIStore extends BaseStore {
  @observable
  showMenu = false;

  @observable
  currentType: GankType = GankType.All;

  @computed
  get dataCache (): GankDataCache {
    let dataCache;
    if (this.jitStore) {
      dataCache = this.jitStore.dataCache.get(this.currentType);
    }
    if (!dataCache) {
      dataCache = {data: [], currentPage: 0};
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
      driverCache = { data: {} };
    }

    return driverCache;
  }

  @computed
  get data () {
    return this.dataCache.data;
  }

  @computed
  get loading () {
    return this.jitStore ? this.jitStore.dataCacheLoading : false;
  }

  @action('切换干货类型')
  switchGankType (type: GankType) {
    if (this.showMenu) {
      this.showMenu = false;
    }

    this.currentType = type;
  }

  @bind
  loadNextPage() {
    return this.jitStore.loadNextPageOfType(this.currentType);
  }

  @bind
  driverLogin(phone: string) {
    return this.jitStore.loadDriverLoginType(phone);
  }

  @action('切换菜单展示或隐藏')
  switchMenuShow(show: boolean) {
    this.showMenu = show;
  }

  constructor (public key: string, protected jitStore: GankStore) {
    super(key);
  }
}
