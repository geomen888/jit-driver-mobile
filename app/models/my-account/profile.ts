import { Instance, SnapshotOut, types } from "mobx-state-tree";
import { IOrderNotification, OrderNotificationModel } from './notifications';

export const ProfileModel = types.model("Profile")
.props({
    id: types.maybe(types.string),
    token: types.maybe(types.string),
    name: types.maybe(types.string),
    status: types.maybe(types.string),
    phone: types.maybe(types.string),
    isAuthenticated: types.maybe(types.boolean),
    orderNotifications: types.maybeNull(types.array(OrderNotificationModel)),
  })
  .views((self) => ({
      get isAuthenticate() {
          return self.isAuthenticated || false
      },
      get getNotifications(): IOrderNotification[] {
        return self.orderNotifications || [];
    }
  }));


type ProfileType = Instance<typeof ProfileModel>
export interface IProfile extends ProfileType {}
type ProfileSnapshotType = SnapshotOut<typeof ProfileModel>
export interface ProfileSnapshot extends ProfileSnapshotType {}
export const createProfileDefaultModel = () => types.optional(ProfileModel, {})