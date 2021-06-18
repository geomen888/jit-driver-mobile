import { DriverModel } from "."

test("can be created", () => {
  const instance = DriverModel.create({
    id: '1',
    name: "Rick Sanchez",
  })

  expect(instance).toBeTruthy()
})
