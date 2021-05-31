import { Instance, SnapshotOut, types } from "mobx-state-tree"

/**
 * Rick and Morty character model.
 */
export const DriverModel = types.model("Driver").props({
  id: types.identifierNumber,
  name: types.maybe(types.string),
  status: types.maybe(types.string),
  image: types.maybe(types.string),
})

type DriverType = Instance<typeof DriverModel>
export interface Driver extends DriverType {}
type DriverSnapshotType = SnapshotOut<typeof DriverModel>
export interface DriverSnapshot extends DriverSnapshotType {}
export const createDriverDefaultModel = () => types.optional(DriverModel, {})

/**
 * export const CharacterModel = types.model("Character").props({
  id: types.identifierNumber,
  name: types.maybe(types.string),
  status: types.maybe(types.string),
  image: types.maybe(types.string),
})

type CharacterType = Instance<typeof CharacterModel>
export interface Character extends CharacterType {}
type CharacterSnapshotType = SnapshotOut<typeof CharacterModel>
export interface CharacterSnapshot extends CharacterSnapshotType {}
export const createCharacterDefaultModel = () => types.optional(CharacterModel, {})

 */