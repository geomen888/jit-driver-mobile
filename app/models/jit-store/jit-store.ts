import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { DriverModel, DriverSnapshot } from "../driver/driver"
import { ProfileModel, ProfileSnapshot } from '../my-account/profile';
import { CharacterApi } from "../../services/api/character-api"
import { withEnvironment } from "../extensions/with-environment"
import { LoadingSatatus } from '../../common/enums/profile-loading-status.type'
/**
 * Example store containing Rick and Morty characters
 */
export const JitStoreModel = types
  .model("JitStore")
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
    saveProfile: (profile: Partial<ProfileSnapshot>) => {
      self.profile.id = profile.id || self.profile.id || '';
      self.profile.token = profile.token || '';
      self.profile.isAuthenticated = Boolean(profile.token)
      self.profile.name = profile.name ||  self.profile.name || '';
      self.profile.status = profile.status || self.profile.status || '';
      self.profile.phone = profile.phone || self.profile.phone || '';
    },
    resetProfile: () => {
      // self.profile.id = '';
      self.profile.token = '';
      // self.profile.name = '';
      // self.profile.status = '';
      // self.profile.phone = '';
      self.profile.isAuthenticated = false;
      self.stateProfile = LoadingSatatus.IDLE;
      // console.log('resetProfile::', self.profile);

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
      },
      get isAuthenticated() {
        return self.profile.isAuthenticate
      },
      get getProfile() {
        return ({
          ...self.profile,
          isAuthenticated: self.profile.isAuthenticate
        })
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

type JitStoreType = Instance<typeof JitStoreModel>
export interface JitStore extends JitStoreType {}
type JitStoreSnapshotType = SnapshotOut<typeof JitStoreModel>
export interface JitStoreSnapshot extends JitStoreSnapshotType {}
export const createDriverStoreDefaultModel = () => types.optional(JitStoreModel, {})
