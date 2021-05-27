import WSS from 'ws';
import Debug from 'debug';
import { put, call, take } from 'redux-saga/effects';
import { eventChannel } from 'redux-saga';

import { IToken, TWsCb } from '../../types';
import { DEBUG } from '@env';
import {
    // ActionWithPayload,
    // ApiCallType,
    WssCallType,
  } from '../../framework/types';

const debug = Debug('wss:connect:');
const error = Debug('wss:connect:error:');

debug.enabled = DEBUG || false;
error.enabled = DEBUG || false;


export const connectWss = ({ token }: IToken) => {
    debug('connectWss:token:: ', token);
    const wss = new WSS('wss://6kcv5f7ko9.execute-api.eu-central-1.amazonaws.com/dev', {
        headers: {
            "X-Amz-Security-Token": token,
        }
    });
    return new Promise(resolve => {
        wss.on('open', function open() {
            console.log('connected:wss...');

            resolve(wss)
        });
    });
};

export const subscribeSocketChannel = (socket: WSS, instance: string) => eventChannel((emit) => {
    const handler = (data: any) => {
      debug(`subscribeSocketChannel:data:${JSON.stringify(data)}`);
      emit(data);
    };
    debug(`subscribeSocketChannel:instance:${instance}`);
    //  const pingHandler = (event) => {
    //       // puts event payload into the channel
    //       // this allows a Saga to take this payload from the returned channel
    //       emit(event.payload);
    //     }
    const errorHandler = (errorEvent: WSS.ErrorEvent) => {
      error('subscribeSocketChannel:errorHandler: ', errorEvent.message);
      // create an Error object and put it into the channel
      emit(new Error(errorEvent.message));
    };
    // setup the subscription
    // socket.on('ping', pingHandler);
    socket.on('error', errorHandler);
    socket.on(instance, handler);
  
    return () => {
      // socket.off('ping', pingHandler);
      socket.off(instance, handler);
    };
  });
  
  export function* read(socket: WSS, event: string, type: WssCallType, callback: TWsCb) {
    const socketChannel = yield call(subscribeSocketChannel, socket, event);
    while (true) {
      const { data, status, message } = yield take(socketChannel);
      debug(`read:logged_${type}:status:`, status);
      debug(`read:logged_${type}:date:`, data);
      const feedback = callback(type, status, data, message);
      debug(`read:logged_${type}:feedback:`, feedback);
      yield put(feedback);
    }
  }
  