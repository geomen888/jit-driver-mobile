import { DriverModel } from "./driver"

test("can be created", () => {
  const instance = DriverModel.create({
    _id: '1',
    name: "Rick Sanchez",
  })

  expect(instance).toBeTruthy()
})
