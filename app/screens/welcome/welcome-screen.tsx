import React, { useState, FunctionComponent, PropsWithChildren, useEffect,  useLayoutEffect } from "react";
import Debug from 'debug';
import { DEBUG } from '@env';
import {
  View,
  Image,
  ViewStyle,
  TextStyle,
  ImageStyle,
  TouchableWithoutFeedback,
  SafeAreaView,
  Keyboard,

  TextInput
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { observer } from "mobx-react-lite"
import { inject } from 'mobx-react';
import { Button, Header, Screen, Text, Wallpaper } from "../../components"
import { color, spacing, typography } from "../../theme"
// import { Util } from '../../utils';
import JitUIStore from '../../stores/JitUIStore';


// import { LoadingSatatus } from '../../common/enums/profile-loading-status.type';

const bowserLogo = require("./bowser.png")

const debug = Debug('welcomeScreen:');
const error = Debug('welcomeScreen:error:');

debug.enabled = DEBUG || false;
error.enabled = DEBUG || false;

const FULL: ViewStyle = { flex: 1 }
const CONTAINER: ViewStyle = {
  backgroundColor: color.transparent,
  paddingHorizontal: spacing[4],
}
const TEXT: TextStyle = {
  color: color.palette.white,
  fontFamily: typography.primary,
}
const BOLD: TextStyle = { fontWeight: "bold" }
const HEADER: TextStyle = {
  paddingTop: spacing[3],
  paddingBottom: spacing[4] + spacing[1],
  paddingHorizontal: 0,
}
const HEADER_TITLE: TextStyle = {
  ...TEXT,
  ...BOLD,
  fontSize: 12,
  lineHeight: 15,
  textAlign: "center",
  letterSpacing: 1.5,
}
const TITLE_WRAPPER: TextStyle = {
  ...TEXT,
  textAlign: "center",
}
const TITLE: TextStyle = {
  ...TEXT,
  ...BOLD,
  fontSize: 28,
  lineHeight: 38,
  textAlign: "center",
}
const ALMOST: TextStyle = {
  ...TEXT,
  ...BOLD,
  fontSize: 26,
  fontStyle: "italic",
}
const BOWSER: ImageStyle = {
  alignSelf: "center",
  marginVertical: spacing[5],
  maxWidth: "100%",
}
const CONTENT: TextStyle = {
  ...TEXT,
  color: "#BAB6C8",
  fontSize: 15,
  lineHeight: 22,
  marginBottom: spacing[5],
}
const CONTINUE: ViewStyle = {
  paddingVertical: spacing[4],
  paddingHorizontal: spacing[4],
  backgroundColor: "#5D2555",
}

const LOGIN: TextStyle = {
  padding: 10,
  marginBottom: 10,
  fontSize: 13,
  backgroundColor: "#ff00ff",
  borderWidth: 1,
  borderRadius: 3
}
const CONTINUE_TEXT: TextStyle = {
  ...TEXT,
  ...BOLD,
  fontSize: 13,
  letterSpacing: 2,
}
const FOOTER: ViewStyle = { backgroundColor: "#20162D", marginBottom: 64 }
const FOOTER_CONTENT: ViewStyle = {
  paddingVertical: spacing[4],
  paddingHorizontal: spacing[4],
}

// const propTypes = {
//   children:  PropTypes.shape({ jit: PropTypes.object }),
// };

// type ScreensProps = PropTypes.InferProps<typeof propTypes>;

interface IScreenProps {
  jit?: JitUIStore;
}

export const WelcomeScreen: FunctionComponent<PropsWithChildren<IScreenProps>> = inject('jit')(observer(({ jit }) => {
    const navigation = useNavigation()
    const nextScreen = () => navigation.navigate("demo")
    const [text, setText] = useState('')
    // const { profileCache = {}, ProfileLoading = LoadingSatatus.IDLE } = jit
    const login = () => {
      try {
       debug('phone::', text);
      // const driverCache = Util.dtoToJson(jit.driverCache);
       jit.driverLogin(text);
       // jit.loadNextPage()
       debug('login::', jit.driverCache);
       setText('');
      } catch (e) {
        error(e);
      }
    }

    useEffect(() => {
      // if (!jit || !jit.driverCache) {
      //   return
      // }
      debug('useLayoutEffect:driverCache::', jit.driverCache);
      debug('useLayoutEffect:ProfileLoading::', jit.loading)
      // const cache = Util.dtoToJson(jit.driverCache)
      if (jit.driverCache.isAuthenticated) {
        nextScreen();
      }
    }, [(jit && jit.driverCache), (jit && jit.loading)])

    return (
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View testID="WelcomeScreen" style={FULL}>
          <Wallpaper />
          <Screen style={CONTAINER} preset="scroll" backgroundColor={color.transparent}>
            <Header headerTx="welcomeScreen.poweredBy" style={HEADER} titleStyle={HEADER_TITLE} />
            <Text style={TITLE_WRAPPER}>
              <Text style={TITLE} text="Your new app, " />
              <Text style={ALMOST} text="almost" />
              <Text style={TITLE} text="!" />
            </Text>
            <Text style={TITLE} preset="header" tx="welcomeScreen.readyForLaunch" />
            <Image source={bowserLogo} style={BOWSER} />

            <TextInput
              style={LOGIN}
              placeholder='Введите тел +38_'
              value={text}
              onChangeText={setText}
            />
            
            {/* <Text style={CONTENT}>
          This probably isn't what your app is going to look like. Unless your designer handed you
          this screen and, in that case, congrats! You're ready to ship.
        </Text> */}
            {/* <Text style={CONTENT}>
          For everyone else, this is where you'll see a live preview of your fully functioning app
          using Ignite.
        </Text> */}
          </Screen>
          <SafeAreaView style={FOOTER}>
            <View style={FOOTER_CONTENT}>
              <Button
                testID="next-screen-button"
                style={CONTINUE}
                textStyle={CONTINUE_TEXT}
                tx="welcomeScreen.continue"
                onPress={login}
              />
            </View>
          </SafeAreaView>
        </View>
      </TouchableWithoutFeedback>
    )
  }));


// WelcomeScreen.wrappedomponent.propTypes = {
//   jit: PropTypes.object
// }

