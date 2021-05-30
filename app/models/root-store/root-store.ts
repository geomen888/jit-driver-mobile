import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { DriverStoreModel } from "../driver-store/driver-store"

/**
 * A RootStore model.
 */
// prettier-ignore
export const RootStoreModel = types.model("RootStore").props({
  jitStore: types.optional(DriverStoreModel, {} as any),
})

/**
 * The RootStore instance.
 */
export interface RootStore extends Instance<typeof RootStoreModel> {}

/**
 * The data of a RootStore.
 */
export interface RootStoreSnapshot extends SnapshotOut<typeof RootStoreModel> {}
