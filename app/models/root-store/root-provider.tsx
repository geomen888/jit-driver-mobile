import React, { useContext } from "react";
import { MobXProviderContext, useStores } from './root-store-context';

export const Provider = ({ children, ...propsValue }) => {
    const contextValue = useContext(MobXProviderContext);
    const value: any = (() => {
  return ({
    ...contextValue,
    ...propsValue,
  })
})()

    return  <MobXProviderContext.Provider value={value}>{children}</MobXProviderContext.Provider>
}

export const withStore = Component => props => {
    return (<Component {...props} store={useStores()} />);
  };