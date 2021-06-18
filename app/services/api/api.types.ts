import { GeneralApiProblem } from "./api-problem"
import { IDriver } from "../../models/driver"

export interface User {
  id: number
  name: string
}

export type GetUsersResult = { kind: "ok"; users: User[] } | GeneralApiProblem
export type GetUserResult = { kind: "ok"; user: User } | GeneralApiProblem

export type GetCharactersResult = { kind: "ok"; characters: IDriver[] } | GeneralApiProblem
export type GetCharacterResult = { kind: "ok"; character: IDriver } | GeneralApiProblem
