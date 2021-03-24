import './style.css';

import firebase from 'firebase/app';
import 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBeNt1vuODuJI-p49iriLC-4cEeGHwrhUk",
  authDomain: "webrtc-6b180.firebaseapp.com",
  projectId: "webrtc-6b180",
  storageBucket: "webrtc-6b180.appspot.com",
  messagingSenderId: "650637663770",
  appId: "1:650637663770:web:d8dd76b1c719b4fc97bba3",
  measurementId: "G-0X1QB0JGYF"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

//Firestore for storing calls (offerCandidates/answerCandidates)
const firestore = firebase.firestore();

//Stun server
const stunServer = {
  iceServers: [
    {
      urls: ['stun:51.13.78.61:3478'],
    },
  ],
  iceCandidatePoolSize: 10,
};

const peerConnection = new RTCPeerConnection(stunServer); //Manages peer2peer connection
let chatChannel = peerConnection.createDataChannel("chatChannel"); //RTCDataChannel
let localStream = new MediaStream(); //Local webcam/screen stream
let remoteStream = new MediaStream(); //Remote webcam/screen stream

const videos = document.querySelector('.videos');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startWebcamButton = document.getElementById('startWebcamButton');
const stopWebcamButton = document.getElementById('stopWebcamButton');
const startScreenButton = document.getElementById('startScreenButton');
const stopScreenButton = document.getElementById('stopScreenButton');
const changeSizeButton = document.getElementById('changeSizeButton');
const fullscreenButton = document.getElementById('fullscreenButton');
const callButton = document.getElementById('callButton');
const callInput = document.getElementById('callInput');
const connectButton = document.getElementById('connectButton');
const disconnectButton = document.getElementById('disconnectButton');
let messages = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const chatButton = document.getElementById('chatButton');

/**
 * Event handler for peerConnection on iceconnection state change = 'disconnected'
 * Calls connectionClosed
 */
peerConnection.oniceconnectionstatechange = () => {
  if (peerConnection.iceConnectionState == 'disconnected') {
    connectionClosed();
  }
  if (peerConnection.iceConnectionState == 'connected' || peerConnection.iceConnectionState == 'completed') {
    connectButton.disabled = true;
    disconnectButton.disabled = false;
    chatButton.disabled = false;
  }
}

/**
 * Event listener for peerConnection when track is added
 */
peerConnection.addEventListener('track', (event) => {
  remoteVideo.srcObject = event.streams[0];
});

/**
 * Function for handling onopen event
 */
let handleChatChannelOpen = (event) => {
  console.log("onopen: " + event.data);
};

/**
 * Function for handling onmessage event
 */
let handleChatChannelReceivedMessage = (event) => {
  console.log("onmessage: " + event);
};

/**
 * Function for handling onerror event
 */
let handleChatChannelError = (error) => {
  console.log("onerror: " + error);
};

/**
 * Function for handling onclose event
 */
let handleChatChannelClose = (event) => {
  console.log("onclose: ", event);
};

/**
 * Function for initalizing chatChannel
 * @param {*} event : event of callback
 */
let handleChatChannelCallback = (event) => {
  chatChannel = event.channel;
  chatChannel.onopen = handleChatChannelOpen;
  chatChannel.onmessage = handleChatChannelReceivedMessage;
  chatChannel.onerror = handleChatChannelError;
  chatChannel.onclose = handleChatChannelClose;
};

/**
 * Event handler for peerConnection on data channel event
 * Runs handleChatChannelCallback, which fully initializes chatChannel
 */
peerConnection.ondatachannel = handleChatChannelCallback;

/**
 * Event handler for chatChannel on message event
 * Message is received and added to messages element
 * @param {*} event : message event
 */
chatChannel.onmessage = (event) => {
  let message = "Peer: " + event.data + "\n";
  console.log(message);
  messages.innerHTML += message;
};

/**
 * Event listener for remoteVideo when removing remoteVideo
 */
remoteVideo.addEventListener('event', () => {
  if (remoteVideo.srcObject != null) {
    remoteVideo.srcObject = null;
  }
});

/**
 * Event handler for startWebcamButton on click event
 * Function for displaying webcam locally in the application
 * If peer connection is opened, it will be displayed remotely as well
 */
startWebcamButton.onclick = async () => {
  Object.assign(localVideo.style, {
    width: "29vw",
    height: "43vh",
    marginTop: "7vh",
  });

  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  startVideo(localStream);

  startWebcamButton.disabled = true;
  stopWebcamButton.disabled = false;
  startScreenButton.disabled = false;
  stopScreenButton.disabled = true;
};

/**
 * Event handler for stopWebcamButton on click event
 * stopVideo function is called, which will stop local webcam
 * @returns if webcam is not turned on
 */
stopWebcamButton.onclick = async () => stopVideo();

/**
 * Event handler for startScreenButton on click event
 * Function for displaying screen share locally in the application
 * If peer connection is opened, it will be displayed remotely as well
 */
startScreenButton.onclick = async () => {
  try {
    localStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    startVideo(localStream);
  } catch(error) {
    console.error("Error: " + error);
  }

  Object.assign(localVideo.style, {
    height: "32.3vh",
    marginTop: "7vh",
  });

  startWebcamButton.disabled = false;
  stopWebcamButton.disabled = true;
  startScreenButton.disabled = true;
  stopScreenButton.disabled = false;
};

/**
 * Event handler for stopScreenButton on click event
 * stopVideo function is called, which will stop local screen share
 * @returns if screen share is not turned on
 */
stopScreenButton.onclick = async () => stopVideo();

/**
 * Function for adding local video and adding eventual tracks to remoteStream
 * @param {*} localStream : stream of video device (webcam/screen)
 */
function startVideo(localStream) { 
  // Push tracks from local stream to peer connection
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
  remoteStream = remoteVideo.srcObject;

  // Pull tracks from remote stream, add to video stream
  if (remoteStream) {
    peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };
  }
    
  localVideo.srcObject = localStream;
  remoteVideo.srcObject = remoteStream;
}

/**
 * Function for removing tracks from remoteStream and removes video of html element
 * @returns if localStream (webcam/screen) is null
 */
function stopVideo() {
  Object.assign(localVideo.style, {
    width: "29vw",
    height: "43vh",
    marginTop: "7vh",
  });

  localStream = localVideo.srcObject;
  if (localStream == null) {
    console.log("Empty stream!");
    return;
  }

  let tracks = localStream.getTracks();
  tracks.forEach(track => track.stop());

  if (peerConnection.iceConnectionState != 'closed') {
    const senders = peerConnection.getSenders();
    senders.forEach(sender => peerConnection.removeTrack(sender));
  }
  
  localVideo.srcObject = null;

  startWebcamButton.disabled = false;
  stopWebcamButton.disabled = true;
  startScreenButton.disabled = false;
  stopScreenButton.disabled = true;
}

//Amount of times changeSizeButton is clicked
let clicks = 0;

/**
 * Event handler for changeSizeButton on click event
 * The function will change the layout of the videos
 */
changeSizeButton.onclick = () => {
  clicks++;
  if (!(clicks % 2 == 0)) {
    changeSizeButton.innerHTML = "Reduce Remote Video";
    videos.style.gridTemplateAreas = "none";
    Object.assign(remoteVideo.style, {
      width: "60.1vw",
      height: "67vh",
      marginTop: "0",
    });
    Object.assign(localVideo.style, {
      width: "10vw",
      height: "14.85vh",
      marginTop: "59vh",
    });
  }
  else {
    changeSizeButton.innerHTML = "Enlarge Remote Video";
    videos.style.gridTemplateAreas = "'local remote'";
    Object.assign(remoteVideo.style, {
      width: "29vw",
      height: "43vh",
    });
    Object.assign(localVideo.style, {
      width: "29vw",
      height: "43vh",
      marginTop: "7vh",
    });
  }
  
}

/**
 * Event handler for fullscreenButton on click event
 * Function for fullscreen mode
 */
fullscreenButton.onclick = () => {
  remoteVideo.requestFullscreen();
}

/**
 * Event handler for callButton on click event
 * The function will create an offer by the user who starts the call
 */
callButton.onclick = async () => {
  //Reference Firestore collection
  const callDoc = firestore.collection('calls').doc();
  const offerCandidates = callDoc.collection('offerCandidates');
  const answerCandidates = callDoc.collection('answerCandidates');

  callInput.value = callDoc.id;

  //Get candidates for caller and save to database
  peerConnection.onicecandidate = (event) => {
    //Here we are setting up listener before setLocalDescription
    event.candidate && offerCandidates.add(event.candidate.toJSON());
  };

  //Create offer
  const offerDescription = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offerDescription);

  //Object we want to save in the database
  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
  };

  await callDoc.set({ offer });

  //Listen for remote answer abd changes in firstore
  callDoc.onSnapshot((snapshot) => {
    const data = snapshot.data();
    if (!peerConnection.currentRemoteDescription && data?.answer) {
      const answerDescription = new RTCSessionDescription(data.answer);
      //Updating on our peer connection when answer is received
      peerConnection.setRemoteDescription(answerDescription);
    }
  });

  //Adding candidate to peer connection when answered
  answerCandidates.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const candidate = new RTCIceCandidate(change.doc.data());
        peerConnection.addIceCandidate(candidate);
      }
    })
  });

  connectButton.disabled = true;
  disconnectButton.disabled = false;
  chatButton.disabled = false;
};

/**
 * Event listener for callInput
 * When callInput is not empty, connectButton will be clickable
 */
callInput.addEventListener('input', () => {
  connectButton.disabled = false;
});

/**
 * Event handler for connectButton on click event
 * Function for answering a call with a given unique ID
 */
connectButton.onclick = async () => {
  const callId = callInput.value;
  const callDoc = firestore.collection('calls').doc(callId);
  const answerCandidates = callDoc.collection('answerCandidates');
  const offerCandidates = callDoc.collection('offerCandidates');

  peerConnection.onicecandidate = (event) => {
    event.candidate && answerCandidates.add(event.candidate.toJSON());
  };

  const callData = (await callDoc.get()).data();

  //Here we are setting a remote description on our peer connection
  const offerDescription = callData.offer;
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offerDescription));

  const answerDescription = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answerDescription);

  const answer = {
    type: answerDescription.type,
    sdp: answerDescription.sdp,
  };

  await callDoc.update({ answer });

  offerCandidates.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        let data = change.doc.data();
        peerConnection.addIceCandidate(new RTCIceCandidate(data));
      }
    });
  });

  connectButton.disabled = true;
  disconnectButton.disabled = false;
  chatButton.disabled = false;
};

/**
 * Event handler for chatButton on click event
 * Function for sending input message
 * @returns if input message is empty
 */
chatButton.onclick = async () => {
  let message = messageInput.value;
  if(message == ""){
      alert("ERROR: You cannot send empty message!");
      return;
  }
  let print = "You: " + message + "\n";
  console.log(print);
  messages.innerHTML += print;
  chatChannel.send(message);

  messageInput.value = "";
  messageInput.focus();
}

/**
 * Function for handling status change of chat channel
 */
function handleChatChannelStatusChange() {
  if(chatChannel){
    let state = chatChannel.readyState;
    if (state == 'open') {
      messageInput.disabled = false;
      messageInput.focus();
      chatButton.disabled = false;
    }
    else {
      messageInput.disabled = true;
      chatButton.disabled = true;
    }
  }
}

/**
 * Event handler for disconnectButton on click event
 * connectionClosed will be called
 */
disconnectButton.onclick = async () => connectionClosed();

/**
 * Function for closing chat connection and peer connection
 */
function connectionClosed() {
  if (chatChannel) {
    chatChannel.close(); //Closing the chat channel
    chatChannel = null;
  }
  
  peerConnection.close(); //Closing peer connection
  
  remoteVideo.srcObject = null;
  console.log("Other peer disconnected");
  console.log("State: " + peerConnection.iceConnectionState);

  connectButton.disabled = false;
  disconnectButton.disabled = true;
  chatButton.disabled = true;
}