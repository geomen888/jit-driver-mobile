import { DriverStoreModel } from "./driver-store"

test("can be created", () => {
  const instance = DriverStoreModel.create({})

  expect(instance).toBeTruthy()
})
