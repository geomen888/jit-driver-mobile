import { ApiCallType, WssCallType } from './types';
import Debug from 'debug';
import { DEBUG } from '@env';

const debug = Debug('utils:');
const error = Debug('utils:error::');
debug.enabled = DEBUG || true;
error.enabled = DEBUG || true;

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