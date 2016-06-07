/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  Text,
  View,
  ActivityIndicatorIOS,
  PanResponder,
  CameraRoll,
  AlertIOS
} from 'react-native';
import RandomNumberManager from './RandomNumberManager';
import Utils from './Utils';
import Styles from './Styles';

import Swiper from 'react-native-swiper';
import NetworkImage from 'react-native-image-progress';
import Progress from 'react-native-progress';
import ShakeEvent from 'react-native-shake-event-ios';

const DOUBLE_TAP_DELAY = 300;
const DOUBLE_TAP_RADIUS = 20;
const NUM_WALLPAPERS = 10;

class SplashWalls extends Component {

  constructor(props) {
    super(props);
    this.state = {
      wallpapers: [],
      isLoading: true
    };
    
    this.imagePanResponder = {};
    this.prevTouchInfo = {
      prevTouchX: 0,
      prevTouchY: 0,
      prevTouchTimeStamp: 0
    };
    this.currentWallIndex = 0;
  }
  
  componentWillMount() {
    this.imagePanResponder = PanResponder.create({
      onStartShouldSetPanResponder: this.handleStartShouldSetPanResponder,
      onPanResponderGrant: this.handlePanResponderGrant.bind(this),
      onPanResponderRelease: this.handlePanResponderEnd,
      onPanResponderTerminate: this.handlePanResponderEnd
    });
    
    ShakeEvent.addEventListener('shake', () => {
      this.initialize();
      this.fetchWallpapers();
    });
  }
  
  initialize() {
    this.setState({
      wallpapers: [],
      isLoading: true
    });

    this.currentWallIndex = 0;
  }
  
  handleStartShouldSetPanResponder(e, gestureState) {
    return true;
  }
  
  handlePanResponderGrant(e, gestureState) {
    var currentTouchTimeStamp = Date.now();

    if(this.isDoubleTap(currentTouchTimeStamp, gestureState)) 
      this.saveCurrentWallpaperToCameraRoll();

    this.prevTouchInfo = {
      prevTouchX: gestureState.x0,
      prevTouchY: gestureState.y0,
      prevTouchTimeStamp: currentTouchTimeStamp
    };
  }
  
  isDoubleTap(currentTouchTimeStamp, {x0, y0}) {
    var {prevTouchX, prevTouchY, prevTouchTimeStamp} = this.prevTouchInfo;
    var dt = currentTouchTimeStamp - prevTouchTimeStamp;

    return (dt < DOUBLE_TAP_DELAY && Utils.distance(prevTouchX, prevTouchY, x0, y0) < DOUBLE_TAP_RADIUS);
  }
  
  handlePanResponderEnd(e, gestureState) {
    //console.log('pulled up from the image');
  }
  
  saveCurrentWallpaperToCameraRoll() {
    var {wallpapers} = this.state;
    var currentWall = wallpapers[this.currentWallIndex];
    var currentWallURL = `http://unsplash.it/${currentWall.width}/${currentWall.height}?image=${currentWall.id}`;
    
    CameraRoll.saveImageWithTag(currentWallURL).then((data) => {
      AlertIOS.alert(
        'Saved',
        'Wallpaper successfully saved to Camera Roll',
        [
          {text: 'High 5!', onPress: () => console.log('OK Pressed!')}
        ]
      );
    });
  }

  componentDidMount() {
    this.fetchWallpapers();
  }

  fetchWallpapers() {
    console.log('Fetching Wallpapers');
    const url = 'http://unsplash.it/list';
    fetch(url)
      .then( response => response.json() )
      .then( jsonData => {

        console.log('manager', RandomNumberManager);
        let randomIds = RandomNumberManager.uniqueRandomNumbers(NUM_WALLPAPERS, 0, jsonData.length);
        let wallpapers = [];
        randomIds.forEach(randomId => {
          wallpapers.push(jsonData[randomId]);
        });

        console.log('Fetched Wallpapers and randomized', wallpapers);
        this.setState({
          isLoading: false,
          wallpapers: [].concat(wallpapers)
        });
      })
    .catch( error => console.log('Fetch error' + error) );
  }

  renderLoadingMessage() {
    return (
      <View style={Styles.loadingContainer}>
        <ActivityIndicatorIOS
          animating={true}
          color={'#fff'}
          size={'large'}
          style={{margin: 15}} />
        <Text style={{color: '#fff'}}>Contacting Unsplash</Text>
      </View>
    );
  }
  
  onMomentumScrollEnd(e, state, context) {
    this.currentWallIndex = state.index;
  }

  renderResults() {
    let {wallpapers, isLoading} = this.state;
    let wallpapers1 = [];
    let wallpapers2 = [];
    wallpapers.map((wallpaper, index) => {
      if (index < (NUM_WALLPAPERS/2)) {
        wallpapers1.push(wallpaper);
      }
      else {
        wallpapers2.push(wallpaper);
      }
    });

    if( !isLoading ) {
      return (
        <View>
          <Swiper
            height={Styles.height}
            dot={<View style={{backgroundColor:'#ffaf37', width: 8, height: 8, borderRadius: 10, marginLeft: 3, marginRight: 3, marginTop: 3, marginBottom: 3,}} />}
            activeDot={<View style={{backgroundColor: '#fff', width: 13, height: 13, borderRadius: 7, marginLeft: 7, marginRight: 7}} />}
            loop={false}
            onMomentumScrollEnd={this.onMomentumScrollEnd.bind(this)}>
            {wallpapers1.map((wallpaper, index) => {
              let uri = `https://unsplash.it/${wallpaper.width}/${wallpaper.height}?image=${wallpaper.id}`;
              return(
                <View key={index}>
                  <NetworkImage
                    source={{uri: uri}}
                    style={Styles.wallpaperImage}
                    {...this.imagePanResponder.panHandlers}
                    >
                    <Text style={Styles.label}>Photo by</Text>
                    <Text style={Styles.label_authorName}>{wallpaper.author}</Text>
                  </NetworkImage>
                </View>
              );
            })}
          </Swiper>
          <Swiper
            height={Styles.height}
            dot={<View style={{backgroundColor:'#ffaf37', width: 8, height: 8, borderRadius: 10, marginLeft: 3, marginRight: 3, marginTop: 3, marginBottom: 3,}} />}
            activeDot={<View style={{backgroundColor: '#fff', width: 13, height: 13, borderRadius: 7, marginLeft: 7, marginRight: 7}} />}
            loop={false}
            onMomentumScrollEnd={this.onMomentumScrollEnd.bind(this)}>
            {wallpapers2.map((wallpaper, index) => {
              let uri = `https://unsplash.it/${wallpaper.width}/${wallpaper.height}?image=${wallpaper.id}`;
              return(
                <View key={index}>
                  <NetworkImage
                    source={{uri: uri}}
                    style={Styles.wallpaperImage}
                    {...this.imagePanResponder.panHandlers}
                    >
                    <Text style={Styles.label}>Photo by</Text>
                    <Text style={Styles.label_authorName}>{wallpaper.author}</Text>
                  </NetworkImage>
                </View>
              );
            })}
          </Swiper>
        </View>
      );
    }
  }

  render() {
    let { isLoading } = this.state;
    if (isLoading) {
      return this.renderLoadingMessage();
    }
    else {
      return this.renderResults();
    }
  }
}

AppRegistry.registerComponent('SplashWalls', () => SplashWalls);
