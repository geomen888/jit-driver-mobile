import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { DriverModel, DriverSnapshot } from "../driver/driver"
import { ProfileModel, ProfileSnapshot } from '../my-account/profile';
import { CharacterApi } from "../../services/api/character-api"
import { withEnvironment } from "../extensions/with-environment"
import { LoadingSatatus } from '../../common/enums/profile-loading-status.type'
/**
 * Example store containing Rick and Morty characters
 */
export const DriverStoreModel = types
  .model("DriverStore")
  .props({
    drivers: types.optional(types.array(DriverModel), []),
    profile: types.optional(ProfileModel, {}),
    stateProfile: types.maybe(types.enumeration('ProfileLoadingStatus', Object.values(LoadingSatatus))),
    stateDrivers: types.maybe(types.enumeration('DriversLoadingStatus', Object.values(LoadingSatatus))),
  })
  .extend(withEnvironment)
  .actions((self) => ({
    saveDrivers: (driverSnapshots: DriverSnapshot[]) => {
      self.drivers.replace(driverSnapshots)
    },
    setDriversLoadingStatus: (status: LoadingSatatus) => {
      self.stateDrivers = status;
    }
  }))
  .actions((self) => ({
    saveProfile: (profile: ProfileSnapshot) => {
      self.profile.id = profile.id || null;
      self.profile.token = profile.token || null;
      self.profile.name = profile.name || null;
      self.profile.status = profile.status || null;
      self.profile.phone = profile.phone || null;
    },
    setProfileLoadingStatus: (status: LoadingSatatus) => {
      self.stateProfile = status;
    }
  }))
  .views((self) => ({
      get getToken() {
          return self.profile.token || '';
      },
      get profileLoading() {

        return self.stateProfile || LoadingSatatus.IDLE
      }
  }))
  .actions((self) => ({
    getDrivers: async () => {
      const characterApi = new CharacterApi(self.environment.api)
      const result = await characterApi.getCharacters()

      if (result.kind === "ok") {
        self.saveDrivers(result.characters)
      } else {
        // __DEV__ && console.tron.log(result.kind)
      }
    },
  }))

type DriverStoreType = Instance<typeof DriverStoreModel>
export interface DriverStore extends DriverStoreType {}
type DriverStoreSnapshotType = SnapshotOut<typeof DriverStoreModel>
export interface DriverStoreSnapshot extends DriverStoreSnapshotType {}
export const createDriverStoreDefaultModel = () => types.optional(DriverStoreModel, {})
