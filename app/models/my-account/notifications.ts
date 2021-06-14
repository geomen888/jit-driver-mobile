import { Instance, SnapshotOut, types } from "mobx-state-tree";
import { DriverNotificationType } from '../../common/enums/driver-notification.type';
import { Util } from '../../utils';

// export class CustomNotification {
//     public data: object;

//     constructor(readonly strObj: string) {
//         if (!Util.isJsonParsable(strObj)) {
//             throw new Error("invalid object")
//         }
//         this.data = JSON.parse(strObj)
//     }

//     public toString() {
//         return JSON.stringify(this.data);
//     }
// }

// const notification = types.custom<string, CustomNotification>({
//     name: "notification",
//     fromSnapshot(value: string) {
//         return new CustomNotification(value)
//     },
//     toSnapshot(value: CustomNotification) {
//         return value.toString()
//     },
//     isTargetType(v) {
//         return v instanceof CustomNotification
//     },
//     getValidationMessage(v: any) {
//         try {
//             // tslint:disable-next-line: no-unused-expression
//             new CustomNotification(v)
//             return ""
//         } catch (e) {
//             return e.message
//         }
//     }
// })

export const OrderNotificationModel = types.model("OrderNotification")
.props({
    id: types.maybe(types.string),
    orderId: types.maybe(types.string),
    created: types.maybe(types.string),
  })
  .views((self) => ({

  }));


type OrderNotificationType = Instance<typeof OrderNotificationModel>
export interface IOrderNotification extends OrderNotificationType {}
type OrderNotificationSnapshotType = SnapshotOut<typeof OrderNotificationModel>
export interface OrderNotificationSnapshot extends OrderNotificationSnapshotType {}
export const createNotificationDefaultModel = () => types.optional(OrderNotificationModel, {})