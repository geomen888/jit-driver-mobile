import React, { useState, FunctionComponent, useEffect } from "react";
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
  TextInput,
  ActivityIndicator
} from "react-native"
import { withStore } from '../../models';
import { useNavigation } from "@react-navigation/native"
import { observer } from "mobx-react-lite"
import { Button, Header, Screen, Text, Wallpaper } from "../../components"
import { color, spacing, typography } from "../../theme"
import JitUIStore from '../../stores/JitUIStore';

// tslint:disable-next-line: no-var-requires
const bowserLogo = require("./bowser.png");

const debug = Debug('welcomeScreen:');
const error = Debug('welcomeScreen:error:');

debug.enabled = DEBUG || false;
error.enabled = DEBUG || false;

const FULL: ViewStyle = { flex: 1 }
const CONTAINER: ViewStyle = {
  backgroundColor: color.transparent,
  paddingHorizontal: spacing[4],
}
const LOAD_INDICATOR_CONTAINER: ViewStyle = {
    flex: 1,
    justifyContent: "center"
}
const LOAD_INDICATOR_HORIZONTAL: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-around",
  padding: 10
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
// const CONTENT: TextStyle = {
//   ...TEXT,
//   color: "#BAB6C8",
//   fontSize: 15,
//   lineHeight: 22,
//   marginBottom: spacing[5],
// }
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

interface IScreenProps {
  jit?: JitUIStore;
}

export const WelcomeScreen: FunctionComponent<{ store: IScreenProps }> =
  observer(withStore((props: { store: IScreenProps }) => {
    const { store: { jit } } = props;
    // debug('payload::', jit);
    // debug('props::', props);
    const navigation = useNavigation()
    const nextScreen = () => navigation.navigate("demo")
    const [text, setText] = useState('')
    // const { profileCache = {}, ProfileLoading = LoadingSatatus.IDLE } = jit
    const login = () => {
      try {
        // debug('jit::', jit);
        debug('phone:::', text);
        jit.driverLogin(text);
        debug('login::', jit.profileCache);
        setText('');
        jit.switchAuth(true);
      } catch (e) {
        jit.switchAuth(false);
        error(e);
      }
    }

    useEffect(() => {
      if (!jit) {

        return;
      }
      debug('useLayoutEffect:isAuthenticated::', jit.isAuthenticated);
      debug('useLayoutEffect:profileCache::', jit.profileCache);
      debug('useLayoutEffect:ProfileLoading::', jit.profileLoading)
      // const cache = Util.dtoToJson(jit.driverCache)
      if (jit.isAuthenticated) {
        jit.getAllActiveDriver();
        nextScreen();
      }
    }, [jit?.isAuthenticated, jit?.profileLoading])

    return jit?.profileLoading
      ? (<View style={[LOAD_INDICATOR_CONTAINER, LOAD_INDICATOR_HORIZONTAL]}>
        <ActivityIndicator size="large" color={color.blue} />
      </View>)
      : (
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

