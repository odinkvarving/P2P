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

const firestore = firebase.firestore();

const stunServer = {
  iceServers: [
    {
      urls: ['stun:51.13.78.61:3478'],
    },
  ],
  iceCandidatePoolSize: 10,
};

//Global state
const peerConnection = new RTCPeerConnection(stunServer); //Manages peer2peer connection
let localStream = new MediaStream(); //Local webcam/screen stream
let remoteStream = new MediaStream(); //Remote webcam/screen stream

//Elements
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
const messages = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const chatButton = document.getElementById('chatButton');

peerConnection.oniceconnectionstatechange = () => {
  if (peerConnection.iceConnectionState == 'disconnected') {
    connectionClosed();
  }
}

peerConnection.addEventListener('track', (event) => {
  remoteVideo.srcObject = event.streams[0];
});

remoteVideo.addEventListener('event', () => {
  if (remoteVideo.srcObject != null) {
    remoteVideo.srcObject = null;
  }
});

//Function which will display webcam in the browser/application
startWebcamButton.onclick = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  startVideo(localStream);

  startWebcamButton.disabled = true;
  stopWebcamButton.disabled = false;
  startScreenButton.disabled = false;
  stopScreenButton.disabled = true;
};

//Function which will stop webcam 
stopWebcamButton.onclick = async () => stopVideo();

//Function which will display screen in the browser/application
startScreenButton.onclick = async () => {
  try {
    localStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    startVideo(localStream);
  } catch(error) {
    console.error("Error: " + error);
  }

  startWebcamButton.disabled = false;
  stopWebcamButton.disabled = true;
  startScreenButton.disabled = true;
  stopScreenButton.disabled = false;
};

//Function which will stop screen share
stopScreenButton.onclick = async () => stopVideo();

//Function which adds tracks to remoteStream and adds video to html element
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

//Function which removes tracks to remoteStream and removes video from html element
function stopVideo() {
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

//Change size of videos
changeSizeButton.onclick = () => {
  clicks++;
  if (!(clicks % 2 == 0)) {
    changeSizeButton.innerHTML = "Reduce Remote Video";
    videos.style.gridTemplateAreas = "none";
    Object.assign(remoteVideo.style, {
      width: "45.1vw",
      height: "67vh",
      marginTop: "0",
    });
    Object.assign(localVideo.style, {
      width: "10vw",
      height: "14.85vh",
      marginTop: "52.6vh",
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
      marginTop: "0",
    });
  }
  
}

//Function for fullscreen mode
fullscreenButton.onclick = () => {
  remoteVideo.requestFullscreen();
}

//Offer created by the user who starts the call
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
};

//Event listener for call ID
//When callInput is not empty, connectButton will be clickable
callInput.addEventListener('input', () => {
  connectButton.disabled = false;
});

//Answering call with unique ID
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
};

disconnectButton.onclick = async () => {
  connectionClosed();

}

function connectionClosed() {
  peerConnection.close();
  remoteVideo.srcObject = null;
  console.log("Other peer disconnected");
  console.log("State: " + peerConnection.iceConnectionState);
}