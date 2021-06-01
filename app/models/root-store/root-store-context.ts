import { createContext, useContext } from "react";
// import { RootStore } from "./root-store"
import JitUIStore from "../../stores/JitUIStore"

/**
 * Create a context we can use to
 * - Provide access to our stores from our root component
 * - Consume stores in our screens (or other components, though it's
 *   preferable to just connect screens)
 */
// const RootStoreContext = createContext<RootStore>({} as RootStore)

export const MobXProviderContext = createContext({} as  JitUIStore)
// export const MobXProviderContextProvider = MobXProviderContext.Provider;
export const useStores = () => {
    const payl: any = useContext(MobXProviderContext);
     // console.log('context::', payl)

    return ({ [payl?.value?.key]: payl.value })
}

/* HOC to inject store to any functional or class component */


/**
 * The provider our root component will use to expose the root store
 */
// export const RootStoreProvider: any = MobXProviderContext.Provider

/**
 * A hook that screens can use to gain access to our stores, with
 * `const { someStore, someOtherStore } = useStores()`,
 * or less likely: `const rootStore = useStores()`
 */


