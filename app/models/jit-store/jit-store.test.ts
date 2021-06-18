import { JitStoreModel } from "."

test("can be created", () => {
  const instance = JitStoreModel.create({})

  expect(instance).toBeTruthy()
})
