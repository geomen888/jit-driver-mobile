import { PROTOCOL as protocol } from "@env";

export enum GankType {
  All = 'all',
  Android = 'Android',
  IOS = 'iOS',
  EasyVideo = '休息视频',
  Welfare = '福利',
  ExpandResource = '拓展资源',
  FrontEnd = '前端',
  App = 'App',
  Flub = '瞎推荐'
}


export const location = {
  protocol: protocol
}
