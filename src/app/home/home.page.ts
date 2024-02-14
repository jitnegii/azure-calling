import { Component, Inject, NgZone } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  Platform,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons'; // Import this
import {
  Call,
  CallAgent,
  CallClient,
  IncomingCall,
} from '@azure/communication-calling';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import { NgIf } from '@angular/common';
import { call, close, mic, micOff, volumeHigh } from 'ionicons/icons';
import { Timer } from '../util/timer';

import { setLogLevel, createClientLogger, AzureLogger } from '@azure/logger';

import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { Device } from '@ionic-native/device/ngx';

import  * as AudioToggle from 'src/cordova-plugin-audiotoggle-bluetooth/www/audiotoggle';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonIcon,
    IonContent,
    IonButton,
    NgIf,
  ],
})
export class HomePage {
  accessToken =
    'eyJhbGciOiJSUzI1NiIsImtpZCI6IjYwNUVCMzFEMzBBMjBEQkRBNTMxODU2MkM4QTM2RDFCMzIyMkE2MTkiLCJ4NXQiOiJZRjZ6SFRDaURiMmxNWVZpeUtOdEd6SWlwaGsiLCJ0eXAiOiJKV1QifQ.eyJza3lwZWlkIjoiYWNzOjY1YzI1ZWZlLWQ4ZDMtNGJlOC05ZmVmLWVlZDhlYzNlZjU1OV8wMDAwMDAxZC1mNWY1LTY5OWMtMDJjMy01OTNhMGQwMDA4NmMiLCJzY3AiOjE3OTIsImNzaSI6IjE3MDc4MjYxNjgiLCJleHAiOjE3MDc5MTI1NjgsInJnbiI6ImFtZXIiLCJhY3NTY29wZSI6InZvaXAiLCJyZXNvdXJjZUlkIjoiNjVjMjVlZmUtZDhkMy00YmU4LTlmZWYtZWVkOGVjM2VmNTU5IiwicmVzb3VyY2VMb2NhdGlvbiI6InVuaXRlZHN0YXRlcyIsImlhdCI6MTcwNzgyNjE2OH0.huWKmqaZjwMa4gO_OoR5BjJSTbKzE7jBrFqMItBoEPk13GJTxxdjYhYg2jS0Uiz9dykHFvrxbkaCaIvf6I6V6DFC98k96KBz1LQYATQfSEwcb1vFiXR8SVHjjLE7wtKSBzdrOpxHfejfCr9AmZw2uJbacgGq_UU_JVv0-oxJcXcVkxC11iI78W2YCaWuk-TUuSIQ7glOoATpXspRbQP7P63h03QHvNn5iY-F3IRxN7HsqHW3AcFxV9Lwtr_b4QOxpJsHG0FyPc7MooauXYooacyctniNnK1LzJXMeLRLRHwFngOtJaAFrlN5HouCuxfO8ml3OgY_EhnyJ5mvuEFWnA'
    
  jitUserId =
    '8:acs:65c25efe-d8d3-4be8-9fef-eed8ec3ef559_0000001d-f5f5-699c-02c3-593a0d00086c';

  aneeshaUserId =
    '8:acs:65c25efe-d8d3-4be8-9fef-eed8ec3ef559_0000001d-f617-da29-99c6-593a0d001a4c';

  thirdUserId =
    '8:acs:65c25efe-d8d3-4be8-9fef-eed8ec3ef559_0000001d-f92f-a26e-f6c7-593a0d002c94';

  botId = '8:echo123';

  // audioToggle = new AudioToggle()
  

  userToCall = this.aneeshaUserId;
  callClient: CallClient;
  callAgent: CallAgent;
  incomingCall: IncomingCall | null;
  call: Call | null;

  isCalling = false;
  isIncomingCall = false;
  isConnected = false;

  duration: number = 0;
  timer: Timer;
  platformType: any;
  versionType: any;

  isOnSpeaker:boolean = false

  iosCordova = false; // I use these for easy if-else logic later
  androidCordova = false; // but I want you to see how I handle the logic

  constructor(
    private platform: Platform,
    private zone: NgZone,
    private androidPermissions: AndroidPermissions,
    private device: Device
  ) {
    
    this.platformType = this.device.platform;
    this.versionType = this.device.version;
    // navigator.mediaDevices.getUserMedia
    console.log('Current platform is', this.device.platform);
    this.iosCordova = this.platform.is('ios');
    this.androidCordova = this.platform.is('android');
    // && typeof cordova !== 'undefined'
    addIcons({ call, close, mic, micOff,volumeHigh });

    platform.ready().then(() => {
      this.requestPermission();
    });

    this.timer = new Timer((duration) => {
      this.duration = duration;
    });
  }

  ngOnInit() {
    if (!this.androidCordova) {
      // is NOT Android Native App
      this.init();
    }
  }

  async init() {
    // this.stopAllStream()
    setLogLevel('error');
    let logger = createClientLogger('ACS');
    this.callClient = new CallClient({ logger });

    AzureLogger.log = (...args) => {
      // To console, file, buffer, REST API, etc...
      console.log('Azure logs ', ...args);
    };

    try {
      let tokenCredential = new AzureCommunicationTokenCredential(
        this.accessToken
      );
      this.callAgent = await this.callClient.createCallAgent(tokenCredential, {
        displayName: 'Jitender Singh',
      });
      await this.requetDevicePermission();
     
    
      // Listen for an incoming call to accept.
      this.callAgent.on('incomingCall', this.incomingCallListener.bind(this));
    } catch (error) {
      window.alert('Please submit a valid token!');
      console.log("Error",error);
    }
  }

  async requestPermission() {
    if (this.androidCordova) {
      this.androidPermissions
        .checkPermission(this.androidPermissions.PERMISSION.RECORD_AUDIO)
        .then(
          (result) => {
            console.log('Has mic permission?', result.hasPermission);
            if (!result.hasPermission) {
              this.androidPermissions
                .requestPermission(
                  this.androidPermissions.PERMISSION.RECORD_AUDIO
                )
                .then((data: any) => {
                  console.log('granted permission?', data.hasPermission);
                  this.init();
                });
            } else {
              this.init();
            }
          },
          (err) => {
            console.log(err);
          }
        );
    }
  }


  async requetDevicePermission() {
    let deviceManager = await this.callClient.getDeviceManager();

    await deviceManager.askDevicePermission({ audio: true, video: false });
    console.log('Selected microphone', deviceManager.selectedMicrophone);
    console.log('Selected speaker', deviceManager.selectedSpeaker);
    
    
  }

  getDuration(): string {
    let sec = (this.duration % 60).toString().padStart(2, '0');
    let min = (Math.floor(this.duration / 60) % 60).toString().padStart(2, '0');
    let hour = (Math.floor(this.duration / (60 * 60)) % 60)
      .toString()
      .padStart(2, '0');

    return `${hour}:${min}:${sec}`;
  }

  getCallStatus(): string {
    if (this.isIncomingCall) {
      return 'Incoming call';
    } else {
      if (this.call) {
        return this.call.state;
      } else {
        return 'Connecting';
      }
    }
  }

  async incomingCallListener(args: { incomingCall: IncomingCall }) {
    try {
      this.zone.run(() => {
        this.incomingCall = args.incomingCall;
        if (this.call) {
          this.incomingCall.reject();
          this.incomingCall = null;
          return;
        }

        this.isCalling = false;
        this.isIncomingCall = true;

        this.incomingCall.on(
          'callEnded',
          this.incomingCallEndedListener.bind(this)
        );
      });

      console.log('Incoming call');
    } catch (error) {
      console.error(error);
      console.log('Error occured while calling');
    }
  }

  incomingCallEndedListener() {
    this.isIncomingCall = false;
    this.isCalling = false;
    this.incomingCall = null;
  }

  callStateChangedListener() {
    if (this.call != null) {
      console.log('Changed state to :', this.call.state);
      console.log(
        'Outgoing call participants length',
        this.call.remoteParticipants.length
      );
      this.call.remoteParticipants.forEach((participant, index) => {
        let id = undefined;
        if (participant.identifier.kind == 'communicationUser') {
          id = participant.identifier.communicationUserId;
        }
        console.log(
          'Outgoing call participant ',
          index,
          'name',
          participant.displayName,
          'userid',
          id
        );
      });

      switch (this.call.state) {
        case 'Connecting':
          break;
        case 'Ringing':
          break;
        case 'Connected':
          this.isOnSpeaker = false
          AudioToggle.setAudioMode(AudioToggle.EARPIECE);
          this.zone.run(() => {
            this.isConnected = true;
            this.timer.start();
          });

          break;
        case 'Disconnecting':
        case 'Disconnected':
          this.timer.stop();
          console.log('Call end reason', this.call.callEndReason);
          if (this.call) {
            this.call.dispose();
          }
          this.call = null;
          this.isConnected = false;
          this.isIncomingCall = false;
          this.isCalling = false;
          break;
        default:
          this.isConnected = false;
      }
    }
  }

  startCAll() {
    if (this.callAgent) {
      this.call = this.callAgent.startCall([{ id: this.userToCall }], {});
      this.call.on('stateChanged', this.callStateChangedListener.bind(this));

      this.isIncomingCall = false;
      this.isCalling = true;
    } else {
      console.log('Call agent not initialized');
    }
  }

  endCall() {
    // end the current call
    // The `forEveryone` property ends the call for all call participants.
    if (this.call) {
      try {
        this.call.hangUp({ forEveryone: true });
      } catch (error) {
        console.error(error);
      }
      this.isIncomingCall = false;
      this.isCalling = false;
    }
  }

  async acceptCall() {
    try {
      if (this.incomingCall) {
        this.call = await this.incomingCall.accept();
        this.call.on('stateChanged', this.callStateChangedListener.bind(this));
        this.zone.run(() => {
          this.isCalling = true;
          this.isIncomingCall = false;
          this.incomingCall = null;
        });
      }
    } catch (error) {
      console.error(error);
      this.isIncomingCall = false;
      this.isCalling = false;
    }
  }

  async rejectCall() {
    try {
      if (this.incomingCall) {
        console.log('Rejecting incomming call');
        await this.incomingCall.reject();
        this.incomingCall = null;
      } else {
        console.log('Incoming call is null');
      }
    } catch (error) {
      console.error(error);
    }
    this.zone.run(() => {
      this.isIncomingCall = false;
      this.isCalling = false;
    });
  }

  toggleMute() {
    if (this.call) {
      if (this.call.isMuted) {
        this.call.unmute();
      } else {
        this.call.mute();
      }
    }
  }

  getCallerId() {
    if (this.call && this.isCalling) {
      const callDirection = this.call.direction;

      if (callDirection === 'Incoming') {
        // console.log('Incoming call');
        if (this.call.callerInfo.identifier?.kind == 'communicationUser') {
          if (this.call.callerInfo.displayName) {
            return this.call.callerInfo.displayName;
          }
          return this.call.callerInfo.identifier.communicationUserId;
        }
      } else if (callDirection === 'Outgoing') {
        return this.userToCall;
      }
    } else if (this.isIncomingCall && this.incomingCall) {
      if (
        this.incomingCall.callerInfo.identifier?.kind == 'communicationUser'
      ) {
        if (this.incomingCall.callerInfo.displayName) {
          return this.incomingCall.callerInfo.displayName;
        }
        return this.incomingCall.callerInfo.identifier.communicationUserId;
      }
    }

    return this.userToCall;
  }

  toggleSpeaker(){
    if(this.isOnSpeaker){
      AudioToggle.setAudioMode(AudioToggle.EARPIECE);
    }else{
      AudioToggle.setAudioMode(AudioToggle.SPEAKER);
    }
    this.isOnSpeaker = !this.isOnSpeaker
  }
}
