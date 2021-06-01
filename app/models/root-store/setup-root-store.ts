import { onSnapshot } from "mobx-state-tree"
import { RootStoreModel, RootStore } from "./root-store"
import { Environment } from "../environment"
import * as storage from "../../utils/storage"
import JitStore from '../../stores/JitStore';
import JitUIStore from '../../stores/JitUIStore';

/**
 * The key we'll be saving our state as within async storage.
 */
const ROOT_STATE_STORAGE_KEY = "root"

/**
 * Setup the environment that all the models will be sharing.
 *
 * The environment includes other functions that will be picked from some
 * of the models that get created later. This is how we loosly couple things
 * like events between models.
 */
export async function createEnvironment() {
  const env = new Environment()
  await env.setup()
  return env
}

export async function setupRootStore() {
    let rootStore: RootStore
    let data: any

    // prepare the environment that will be associated with the RootStore.
    const env = await createEnvironment();
    try {
      // load data from storage
      data = (await storage.load(ROOT_STATE_STORAGE_KEY)) || {}
      // console.log('setupRootStore:data::', data);
      // console.log('setupRootStore:env::', env);
      rootStore = RootStoreModel.create(data, env)
    } catch (e) {
      // if there's any problems loading, then let's at least fallback to an empty state
      // instead of crashing.
      rootStore = RootStoreModel.create({}, env)

      // but please inform us what happened
      __DEV__ && console.tron.error(e.message, null)
    }

    const jitStore = new JitStore('_jit', rootStore);
    const store: JitUIStore = new JitUIStore('jit', jitStore);

    // reactotron logging
    if (__DEV__) {
      env.reactotron.setRootStore(rootStore, data)
    }

    // track changes & save to storage
    onSnapshot(rootStore, (snapshot) => storage.save(ROOT_STATE_STORAGE_KEY, snapshot))

    return store
  }
/**
 * Setup the root state.
 */
// export async function setupRootStore() {
//   let rootStore: RootStore
//   let data: any

//   // prepare the environment that will be associated with the RootStore.
//   const env = await createEnvironment()
//   try {
//     // load data from storage
//     data = (await storage.load(ROOT_STATE_STORAGE_KEY)) || {}
//     // console.log('setupRootStore:data::', data);
//     // console.log('setupRootStore:env::', env);
//     rootStore = RootStoreModel.create(data, env)
//   } catch (e) {
//     // if there's any problems loading, then let's at least fallback to an empty state
//     // instead of crashing.
//     rootStore = RootStoreModel.create({}, env)

//     // but please inform us what happened
//     __DEV__ && console.tron.error(e.message, null)
//   }

//   // reactotron logging
//   if (__DEV__) {
//     env.reactotron.setRootStore(rootStore, data)
//   }

//   // track changes & save to storage
//   onSnapshot(rootStore, (snapshot) => storage.save(ROOT_STATE_STORAGE_KEY, snapshot))

//   return rootStore
// }
