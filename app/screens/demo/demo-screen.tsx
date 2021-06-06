import React, { useEffect, useState, useRef, useCallback } from "react"
import Debug from 'debug';
import { DEBUG } from '@env';
import {
  Image,
  ImageStyle,
  TouchableOpacity,
  Platform,
  TextStyle,
  View,
  ViewStyle,
  StyleSheet,
  Dimensions,
} from "react-native"
// import { Icon } from 'react-native-elements'
import { Button, Divider, Layout, TopNavigation, Icon } from '@ui-kitten/components';
import { useNavigation } from "@react-navigation/native"
import { observer } from "mobx-react-lite"
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { BulletItem, Header, Text, Screen, Wallpaper } from "../../components"
import { color, spacing } from "../../theme"
import * as Location from 'expo-location';
import { withStore } from '../../models';
import { IMapRegion } from './intreface';
import JitUIStore from '../../stores/JitUIStore';

// import { Api } from "../../services/api"
// import { save } from "../../utils/storage"
export const logoIgnite = require("./logo-ignite.png")
export const heart = require("./heart.png")

const debug = Debug('demoScreen:');
const error = Debug('demoScreen:error:');

debug.enabled = DEBUG || false;
error.enabled = DEBUG || false;


const { width, height } = Dimensions.get('window');

const ASPECT_RATIO = width / height;
const LATITUDE = 37.78825;
const LONGITUDE = -122.4324;
const LATITUDE_DELTA = 0.0922;
// const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const FULL: ViewStyle = { flex: 1 }
const CONTAINER: ViewStyle = {
  backgroundColor: color.transparent,
  paddingHorizontal: spacing[4],
}

const BOLD: TextStyle = { fontWeight: "bold" }

const HEADER: TextStyle = {
  paddingTop: spacing[3],
  paddingBottom: spacing[5] - 1,
  paddingHorizontal: 0,
}
const HEADER_TITLE: TextStyle = {
  ...BOLD,
  fontSize: 12,
  lineHeight: 15,
  textAlign: "center",
  letterSpacing: 1.5,
}

const MAP_WRAPPER: ViewStyle = {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-end',
    top: 45,
}
const MAP: ViewStyle = {
  ...StyleSheet.absoluteFillObject,

}
/*
const platformCommand = Platform.select({
  ios: "Cmd + D",
  android: "Cmd/Ctrl + M",
})

const DEMO: ViewStyle = {
  paddingVertical: spacing[4],
  paddingHorizontal: spacing[4],
  backgroundColor: "#5D2555",
}
const DEMO_TEXT: TextStyle = {
  ...BOLD,
  fontSize: 13,
  letterSpacing: 2,
}
const TITLE: TextStyle = {
  ...BOLD,
  fontSize: 28,
  lineHeight: 38,
  textAlign: "center",
  marginBottom: spacing[5],
}
const TAGLINE: TextStyle = {
  color: "#BAB6C8",
  fontSize: 15,
  lineHeight: 22,
  marginBottom: spacing[4] + spacing[1],
}
const IGNITE: ImageStyle = {
  marginVertical: spacing[6],
  alignSelf: "center",
}
const LOVE_WRAPPER: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  alignSelf: "center",
}
const LOVE: TextStyle = {
  color: "#BAB6C8",
  fontSize: 15,
  lineHeight: 22,
}

const MapRootStyle: ViewStyle = {
  flex: 1
}

const MapViewGoogle: ViewStyle = {
  backgroundColor: 'green',
  height: 100,
  justifyContent: 'center',
  alignItems: 'center'
}
const HEART: ImageStyle = {
  marginHorizontal: spacing[2],
  width: 10,
  height: 10,
  resizeMode: "contain",
}
const HINT: TextStyle = {
  color: "#BAB6C8",
  fontSize: 12,
  lineHeight: 15,
  marginVertical: spacing[2],
} */

const SIDE_BOX: ViewStyle = {
    alignSelf: 'flex-end',
    padding: 10,
    width: 50,
    height: "100%",
}

const SIDE_BOX_ITEMS: ViewStyle = {
  top: 50,
  right: 7,
  paddingBottom: 10,
  paddingTop: 10,
}
interface IScreenProps {
  jit?: JitUIStore;
}

export const DemoScreen = observer(withStore((props: { store: IScreenProps }) => {
  const { store: { jit } } = props;
  const navigation = useNavigation()
  const mapView = useRef(null);
  // const [location, setLocation] = useState(null);
  const goBack = () => navigation.goBack()
  const [errorMsg, setErrorMsg] = useState(null);
  const [location, setLocation] = useState(null);
  const [region, setRegion] = useState<IMapRegion>({
    latitude: LATITUDE,
    longitude: LONGITUDE,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LATITUDE_DELTA * ASPECT_RATIO
  });


  const setLocationRegion = useCallback((loc, reg) => {
        setLocation(loc);
        setRegion(reg);
  }, [])


  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      const { coords: loc } = await Location.getCurrentPositionAsync({});
      const tempRegion = {
        latitude: loc.latitude,
        longitude: loc.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LATITUDE_DELTA * ASPECT_RATIO
      }
      debug('location::', loc);
      mapView.current.animateToRegion(tempRegion, 1000);
      jit.coordinatesDriver([loc.latitude, loc.longitude]);
      setLocationRegion(loc, tempRegion)
    })()
  }, [])


  const onPressZoomOut = () => {
    const tempRegion = {
      latitude: region.latitude,
      longitude: region.longitude,
      latitudeDelta: region.latitudeDelta / 2,
      longitudeDelta: region.longitudeDelta / 2,
    };

    setRegion(tempRegion)
    //makes the map appear to "move" to the user
    mapView.current.animateToRegion(tempRegion, 1000);
  }

  const onPressZoomIn = () => {
    const tempRegion = {
      latitude: region.latitude,
      longitude: region.longitude,
      latitudeDelta: region.latitudeDelta * 2,
      longitudeDelta: region.longitudeDelta * 2,
    };
    setRegion(tempRegion)
      //makes the map appear to "move" to the user
    mapView.current.animateToRegion(tempRegion, 1000);
  }

  let text = 'Waiting..';
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    text = JSON.stringify(location);

  }

  // const demoReactotron = React.useMemo(
  //   () => async () => {
  //     console.tron.log("Your Friendly tron log message")
  //     console.tron.logImportant("I am important")
  //     console.tron.display({
  //       name: "DISPLAY",
  //       value: {
  //         numbers: 1,
  //         strings: "strings",
  //         booleans: true,
  //         arrays: [1, 2, 3],
  //         objects: {
  //           deeper: {
  //             deeper: {
  //               yay: "👾",
  //             },
  //           },
  //         },
  //         functionNames: function hello() {
  //           /* dummy function */
  //         },
  //       },
  //       preview: "More control with display()",
  //       important: true,
  //       image: {
  //         uri:
  //           "https://avatars2.githubusercontent.com/u/3902527?s=200&u=a0d16b13ed719f35d95ca0f4440f5d07c32c349a&v=4",
  //       },
  //     })
  //     // make an API call for the demo
  //     // Don't do API like this, use store's API
  //     const demo = new Api()
  //     demo.setup()
  //     demo.getUser("1")
  //     // Let's do some async storage stuff
  //     await save("Cool Name", "Boaty McBoatface")
  //   },
  //   [],
  // )

  return (
    <View testID="DemoScreen" style={FULL}>
      <Wallpaper />
       <Screen style={CONTAINER}  backgroundColor={color.transparent}>
        <Header
          headerTx="demoScreen.howTo"
          leftIcon="back"
          onLeftPress={goBack}
          style={HEADER}
          titleStyle={HEADER_TITLE}
        />
        <View style={MAP_WRAPPER}>
          <MapView
            ref={mapView}
            zoomEnabled={true}
            loadingEnabled={true}
            provider={PROVIDER_GOOGLE}
            showsMyLocationButton={true}
            showsUserLocation={true}
            style={MAP}
            initialRegion={region}
          />
                <View style={SIDE_BOX}>
                  <TouchableOpacity
                      onPress={() => {onPressZoomIn()}}
                      >
                      <View style={SIDE_BOX_ITEMS}>
                        <Icon name='minus-circle-outline' width={32} height={32} fill='#31a04f'/>
                      </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                      onPress={() => {onPressZoomOut()}}
                      >
                      <View style={SIDE_BOX_ITEMS}>
                        <Icon name='plus-circle-outline' width={32} height={32} fill='#31a04f'/>
                      </View>
                  </TouchableOpacity>
                </View>
        </View>
        {/* <Text style={TITLE} preset="header" tx="demoScreen.title" />
        <Text style={TAGLINE} tx="demoScreen.tagLine" />
        <BulletItem text="Integrated here, Navigation with State, TypeScript, Storybook, Solidarity, and i18n." />
        <BulletItem
          text={`To run Storybook, press ${platformCommand}
          or shake the device to show the developer menu, then select "Toggle Storybook"`}
        />
        <BulletItem text="Load up Reactotron!
         You can inspect your app, view the events, interact, and so much more!" /> */}
        {/* <View>
          <Button
            style={DEMO}
            textStyle={DEMO_TEXT}
            tx="demoScreen.reactotron"
            onPress={demoReactotron}
          />
          <Text style={HINT} tx={`demoScreen.${Platform.OS}ReactotronHint` as const} />
        </View> */}
        {/* <Button
          style={DEMO}
          textStyle={DEMO_TEXT}
          tx="demoScreen.demoList"
          onPress={() => navigation.navigate("demoList")}
        />
        <Image source={logoIgnite} style={IGNITE} />
        <View style={LOVE_WRAPPER}>
          <Text style={LOVE} text="Made with" />
          <Image source={heart} style={HEART} />
          <Text style={LOVE} text="by Infinite Red" />
        </View> */}
      </Screen>
    </View>
  )
}));

