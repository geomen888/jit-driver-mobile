import { Instance, SnapshotOut, types } from "mobx-state-tree"

/**
 * Rick and Morty character model.
 */
export const DriverModel = types.model("Driver").props({
  id: types.maybe(types.string),
  name: types.maybe(types.string),
  reg: types.maybe(types.string),
  status: types.maybe(types.string),
  phone: types.maybe(types.string),
  createdAt: types.maybe(types.string),
  lat: types.maybe(types.number),
  lng: types.maybe(types.number),
})

type DriverType = Instance<typeof DriverModel>
export interface IDriver extends DriverType {}
type DriverSnapshotType = SnapshotOut<typeof DriverModel>
export interface DriverSnapshot extends DriverSnapshotType {}
export const createDriverDefaultModel = () => types.optional(DriverModel, {})
