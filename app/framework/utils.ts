import { ApiCallType, WssCallType } from './types';

export function getApiCallType(baseType: string, namespace?: string, key?: string): ApiCallType {
  const slicer = '/';

  if (namespace) {
    namespace += (key ? `<${key}>` : '') + slicer;
  } else {
    namespace = '';
  }

  return {
    PRE_REQUEST: `${namespace}${baseType}${slicer}PRE_REQUEST`,
    REQUEST: `${namespace}${baseType}${slicer}REQUEST`,
    SUCCESS: `${namespace}${baseType}${slicer}SUCCESS`,
    FAILURE: `${namespace}${baseType}${slicer}FAILURE`,
  };
}

export function getWssCallType(baseType: string, namespace?: string, key?: string):  WssCallType {
  const slicer = '/';

  if (namespace) {
    namespace += (key ? `<${key}>` : '') + slicer;
  } else {
    namespace = '';
  }

  return {
    PRE_REQUEST: `${namespace}${baseType}${slicer}PRE_REQUEST`,
    REQUEST: `${namespace}${baseType}${slicer}REQUEST`,
    SUCCESS: `${namespace}${baseType}${slicer}SUCCESS`,
    FAILURE: `${namespace}${baseType}${slicer}FAILURE`,
  };
}
export function isWssType (type: any): type is WssCallType {
  return type && type.PRE_REQUEST && type.REQUEST && type.SUCCESS && type.FAILURE;
}

export function isApiType (type: any): type is ApiCallType {
  return type && type.PRE_REQUEST && type.REQUEST && type.SUCCESS && type.FAILURE;
}


export async function connection(socket: WebSocket, timeout = 10000) {
  const isOpened = () => (socket.readyState === WebSocket.OPEN)
  if (socket.readyState !== WebSocket.CONNECTING) {
    return isOpened()
  }
  else {
    const intrasleep = 100
    const ttl = timeout / intrasleep // time to loop
    let loop = 0
    while (socket.readyState === WebSocket.CONNECTING && loop < ttl) {
      await new Promise(resolve => setTimeout(resolve, intrasleep))
      loop++
    }
    return isOpened()
  }
}