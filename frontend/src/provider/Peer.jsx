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

  const peer = useMemo(() => {
    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
          ],
        },
      ],
      iceCandidatePoolSize: 10,
    });

    // ICE candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        setIceCandidates(prev => [...prev, event.candidate]);
      }
    };

    return pc;
  }, []);

  // Handler for ICE and connection state changes
  useEffect(() => {
    const handleConnectionStateChange = () => {
      setConnectionState(peer.connectionState);
      console.log(`Connection state: ${peer.connectionState}`);
    };

    const handleIceConnectionStateChange = () => {
      setIceConnectionState(peer.iceConnectionState);
      console.log(`ICE connection state: ${peer.iceConnectionState}`);
    };

    peer.addEventListener('connectionstatechange', handleConnectionStateChange);
    peer.addEventListener('iceconnectionstatechange', handleIceConnectionStateChange);

    return () => {
      peer.removeEventListener('connectionstatechange', handleConnectionStateChange);
      peer.removeEventListener('iceconnectionstatechange', handleIceConnectionStateChange);
    };
  }, [peer]);

  // Get collected ICE candidates
  const getIceCandidates = useCallback(() => {
    return iceCandidates;
  }, [iceCandidates]);

  const createOffer = async () => {
    const offer = await peer.createOffer();
    console.log("peer.jsx-offer from createoffer():", JSON.stringify(offer));
    await peer.setLocalDescription(offer);
    return offer;
  };

  const createAnswer = async (offer) => {
    await peer.setRemoteDescription(offer);
    const answer = await peer.createAnswer();
    console.log("peer.jsx-answer from createanswer():", JSON.stringify(answer));
    await peer.setLocalDescription(answer);
    return answer;
  };

  const setRemoteAnswer = async (ans) => {
    console.log("ans passing to peer.setRemoteDescription(ans) in peer.jsx setRemoteAnswer(): ", JSON.stringify(ans));
    await peer.setRemoteDescription(ans);
  };

  const sendStream = async (stream) => {
    try {
      const tracks = stream.getTracks();
      for (const track of tracks) {
        peer.addTrack(track, stream);
      }
      console.log(`Stream sent with ${tracks.length} tracks`);
      return true; // Return success status
    } catch (error) {
      console.error("Error sending stream:", error);
      return false;
    }
  };

  // Track event handler
  const handleTrackEvent = useCallback((e) => {
    if (e.streams && e.streams.length > 0) {
      console.log('Received tracks:', e.track.kind, 'from stream:', e.streams[0].id);
      setRemoteStream(e.streams[0]);
    }
  }, []);

  // Add a negotiation needed handler
  const handleNegotiationNeeded = useCallback(() => {
    console.log(`Negotiation needed!`);
  }, []);

  // Set up event listeners
  useEffect(() => {
    peer.addEventListener('track', handleTrackEvent);
    peer.addEventListener('negotiationneeded', handleNegotiationNeeded);
    
    return () => {
      peer.removeEventListener('track', handleTrackEvent);
      peer.removeEventListener('negotiationneeded', handleNegotiationNeeded);
    };
  }, [peer, handleTrackEvent, handleNegotiationNeeded]);

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
        connectionState,   // Export connection state
        iceConnectionState // Export ICE connection state
      }}
    >
      {children}
    </PeerContext.Provider>
  );
}