import { BaseStore } from '../framework';
import JitStore from './JitStore';
import JitUIStore from './JitUIStore';
// import { location } from '../constants';
import { PROTOCOL as protocol } from "@env";

// console.log('location::', location);

BaseStore.init({
  axiosConfig: {
   baseURL: protocol + '//ucdbj810se.execute-api.eu-central-1.amazonaws.com/dev'
  }
});

export const jitStore = new JitStore('_jit');
export const jitUIStore = new JitUIStore('jit', jitStore);