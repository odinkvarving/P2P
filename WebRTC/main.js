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
      //urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

//Global state
const peerConnection = new RTCPeerConnection(stunServer); //Manages peer2peer connection
let localStream = null; //Local webcam/screen stream
let remoteStream = null; //Remote webcam/screen stream

//Elements
const webcamVideo = document.getElementById('webcamVideo');
const remoteVideo = document.getElementById('remoteVideo');
const webcamButton = document.getElementById('webcamButton');
const screenButton = document.getElementById('screenButton');
const callButton = document.getElementById('callButton');
const callInput = document.getElementById('callInput');
const connectButton = document.getElementById('connectButton');
const disconnectButton = document.getElementById('disconnectButton');

//Function which will display webcam in the browser/application
webcamButton.onclick = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  remoteStream = new MediaStream();

  // Push tracks from local stream to peer connection
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  // Pull tracks from remote stream, add to video stream
  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  webcamVideo.srcObject = localStream;
  remoteVideo.srcObject = remoteStream;

  callButton.disabled = false;
  connectButton.disabled = false;
  webcamButton.disabled = true;
};

//Function which will display screen in the browser/application
screenButton.onclick = async () => {
  localStream = startCapture({ video: true, audio: true });
  remoteStream = new MediaStream();

  //Push tracks from local stream to peer connection
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  //Pull tracks from remote stream and add to video stream
  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    })
  }

  localVideo.srcObject = localStream;
  remoteVideo.srcObject = remoteStream;

  callButton.disabled = false;
  connectButton.disabled = false;
  webcamButton.disabled = true;
};

async function startCapture(displayMediaOptions) {
  let captureStream = null;
  try {
    captureStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
  } catch(err) {
    console.error("Error: " + err);
  }
  return captureStream;
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

  disconnectButton.disabled = false;
};

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
      console.log(change);
      if (change.type === 'added') {
        let data = change.doc.data();
        peerConnection.addIceCandidate(new RTCIceCandidate(data));
      }
    });
  });
};