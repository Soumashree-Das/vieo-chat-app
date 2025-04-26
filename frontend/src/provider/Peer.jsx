// import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// const PeerContext = createContext(null);

// // Top-level named export for hook
// export const usePeer = () => {
//   return useContext(PeerContext);
// };

// // Top-level named export for provider component
// export function PeerProvider({ children }) {
//   const [remoteStream, setRemoteStream] = useState(null);
//   const [iceCandidates, setIceCandidates] = useState([]);
//   const [connectionState, setConnectionState] = useState('new');
//   const [iceConnectionState, setIceConnectionState] = useState('new');

//   const peer = useMemo(() => {
//     const pc = new RTCPeerConnection({
//       iceServers: [
//         {
//           urls: [
//             "stun:stun.l.google.com:19302",
//             "stun:stun1.l.google.com:19302",
//             "stun:stun2.l.google.com:19302",
//           ],
//         },
//       ],
//       iceCandidatePoolSize: 10,
//     });

//     // ICE candidate handler
//     pc.onicecandidate = (event) => {
//       if (event.candidate) {
//         setIceCandidates(prev => [...prev, event.candidate]);
//       }
//     };

//     return pc;
//   }, []);

//   // Handler for ICE and connection state changes
//   useEffect(() => {
//     const handleConnectionStateChange = () => {
//       setConnectionState(peer.connectionState);
//       console.log(`Connection state: ${peer.connectionState}`);
//     };

//     const handleIceConnectionStateChange = () => {
//       setIceConnectionState(peer.iceConnectionState);
//       console.log(`ICE connection state: ${peer.iceConnectionState}`);
//     };

//     peer.addEventListener('connectionstatechange', handleConnectionStateChange);
//     peer.addEventListener('iceconnectionstatechange', handleIceConnectionStateChange);

//     return () => {
//       peer.removeEventListener('connectionstatechange', handleConnectionStateChange);
//       peer.removeEventListener('iceconnectionstatechange', handleIceConnectionStateChange);
//     };
//   }, [peer]);

//   // Get collected ICE candidates
//   const getIceCandidates = useCallback(() => {
//     return iceCandidates;
//   }, [iceCandidates]);

//   const createOffer = async () => {
//     const offer = await peer.createOffer();
//     console.log("peer.jsx-offer from createoffer():", JSON.stringify(offer));
//     await peer.setLocalDescription(offer);
//     return offer;
//   };

//   const createAnswer = async (offer) => {
//     await peer.setRemoteDescription(offer);
//     const answer = await peer.createAnswer();
//     console.log("peer.jsx-answer from createanswer():", JSON.stringify(answer));
//     await peer.setLocalDescription(answer);
//     return answer;
//   };

//   const setRemoteAnswer = async (ans) => {
//     console.log("ans passing to peer.setRemoteDescription(ans) in peer.jsx setRemoteAnswer(): ", JSON.stringify(ans));
//     await peer.setRemoteDescription(ans);
//   };

//   const sendStream = async (stream) => {
//     try {
//       const tracks = stream.getTracks();
//       for (const track of tracks) {
//         peer.addTrack(track, stream);
//       }
//       console.log(`Stream sent with ${tracks.length} tracks`);
//       return true; // Return success status
//     } catch (error) {
//       console.error("Error sending stream:", error);
//       return false;
//     }
//   };

//   // Track event handler
//   const handleTrackEvent = useCallback((e) => {
//     if (e.streams && e.streams.length > 0) {
//       console.log('Received tracks:', e.track.kind, 'from stream:', e.streams[0].id);
//       setRemoteStream(e.streams[0]);
//     }
//   }, []);

//   // Add a negotiation needed handler
//   const handleNegotiationNeeded = useCallback(() => {
//     console.log(`Negotiation needed!`);
//   }, []);

//   // Set up event listeners
//   useEffect(() => {
//     peer.addEventListener('track', handleTrackEvent);
//     peer.addEventListener('negotiationneeded', handleNegotiationNeeded);
    
//     return () => {
//       peer.removeEventListener('track', handleTrackEvent);
//       peer.removeEventListener('negotiationneeded', handleNegotiationNeeded);
//     };
//   }, [peer, handleTrackEvent, handleNegotiationNeeded]);

//   return (
//     <PeerContext.Provider
//       value={{ 
//         peer, 
//         createOffer, 
//         createAnswer, 
//         setRemoteAnswer, 
//         sendStream, 
//         remoteStream,
//         getIceCandidates,
//         connectionState,   // Export connection state
//         iceConnectionState // Export ICE connection state
//       }}
//     >
//       {children}
//     </PeerContext.Provider>
//   );
// }


import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const PeerContext = createContext(null);

// Top-level named export for hook
export const usePeer = () => {
  return useContext(PeerContext);
};

// Top-level named export for provider component
export function PeerProvider({ children }) {
  const [remoteStream, setRemoteStream] = useState(null);
  const [iceCandidates, setIceCandidates] = useState([]);
  const [connectionState, setConnectionState] = useState('new');
  const [iceConnectionState, setIceConnectionState] = useState('new');
  const [dataChannel, setDataChannel] = useState(null);

  const peer = useMemo(() => {
    console.log("Creating new RTCPeerConnection");
    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
          ],
        },
        {
          urls: 'turn:numb.viagenie.ca',
          credential: 'muazkh',
          username: 'webrtc@live.com'
        }
      ],
      iceCandidatePoolSize: 10,
    });

    // ICE candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("New ICE candidate:", event.candidate.candidate);
        setIceCandidates(prev => [...prev, event.candidate]);
      } else {
        console.log("ICE gathering complete");
      }
    };

    // Create a data channel for signaling
    const dc = pc.createDataChannel("signaling");
    dc.onopen = () => console.log("Data channel opened");
    dc.onclose = () => console.log("Data channel closed");
    setDataChannel(dc);

    return pc;
  }, []);

  // Set up track event handler - this is crucial for receiving remote streams
  useEffect(() => {
    if (!peer) return;
    
    const handleTrackEvent = (event) => {
      console.log("Track event received:", event.track.kind);
      if (event.streams && event.streams[0]) {
        console.log("Setting remote stream from track event");
        setRemoteStream(event.streams[0]);
      } else {
        console.warn("Track event has no streams");
      }
    };
    
    peer.addEventListener('track', handleTrackEvent);
    return () => peer.removeEventListener('track', handleTrackEvent);
  }, [peer]);

  // Handler for ICE and connection state changes
  useEffect(() => {
    if (!peer) return;
    
    const handleConnectionStateChange = () => {
      console.log(`Connection state changed to: ${peer.connectionState}`);
      setConnectionState(peer.connectionState);
    };

    const handleIceConnectionStateChange = () => {
      console.log(`ICE connection state changed to: ${peer.iceConnectionState}`);
      setIceConnectionState(peer.iceConnectionState);
      
      // If we reach connected state but don't have a remote stream, try to renegotiate
      if (peer.iceConnectionState === 'connected' && !remoteStream) {
        console.log("Connected but no remote stream, checking tracks");
      }
    };

    peer.addEventListener('connectionstatechange', handleConnectionStateChange);
    peer.addEventListener('iceconnectionstatechange', handleIceConnectionStateChange);

    return () => {
      peer.removeEventListener('connectionstatechange', handleConnectionStateChange);
      peer.removeEventListener('iceconnectionstatechange', handleIceConnectionStateChange);
    };
  }, [peer, remoteStream]);

  // Get collected ICE candidates
  const getIceCandidates = useCallback(() => {
    return iceCandidates;
  }, [iceCandidates]);

  const createOffer = async () => {
    try {
      console.log("Creating offer");
      const offer = await peer.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      console.log("Offer created:", offer.sdp.substring(0, 100) + "...");
      await peer.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error("Error creating offer:", error);
      throw error;
    }
  };

  const createAnswer = async (offer) => {
    try {
      console.log("Setting remote offer description");
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      console.log("Creating answer");
      const answer = await peer.createAnswer();
      console.log("Answer created:", answer.sdp.substring(0, 100) + "...");
      await peer.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error("Error creating answer:", error);
      throw error;
    }
  };

  const setRemoteAnswer = async (ans) => {
    try {
      console.log("Setting remote answer description");
      await peer.setRemoteDescription(new RTCSessionDescription(ans));
      console.log("Remote description set successfully");
    } catch (error) {
      console.error("Error setting remote description:", error);
      throw error;
    }
  };

  const sendStream = async (stream) => {
    try {
      const tracks = stream.getTracks();
      console.log(`Adding ${tracks.length} tracks to peer connection`);
      
      for (const track of tracks) {
        console.log(`Adding track: ${track.kind}`);
        peer.addTrack(track, stream);
      }
      
      return true;
    } catch (error) {
      console.error("Error sending stream:", error);
      return false;
    }
  };

  const addIceCandidate = async (candidate) => {
    try {
      await peer.addIceCandidate(new RTCIceCandidate(candidate));
      console.log("Added ICE candidate successfully");
      return true;
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
      return false;
    }
  };

  const restartIce = async () => {
    try {
      console.log("Restarting ICE");
      const offer = await peer.createOffer({ iceRestart: true });
      await peer.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error("Error restarting ICE:", error);
      throw error;
    }
  };

  return (
    <PeerContext.Provider
      value={{ 
        peer, 
        createOffer, 
        createAnswer, 
        setRemoteAnswer, 
        sendStream, 
        remoteStream,
        getIceCandidates,
        addIceCandidate,
        restartIce,
        connectionState,
        iceConnectionState,
        dataChannel
      }}
    >
      {children}
    </PeerContext.Provider>
  );
}
