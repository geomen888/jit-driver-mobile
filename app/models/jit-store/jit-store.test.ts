import { JitStoreModel } from "./jit-store"

test("can be created", () => {
  const instance = JitStoreModel.create({})

  expect(instance).toBeTruthy()
})
