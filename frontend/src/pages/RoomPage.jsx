import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSocket } from "../provider/SocketProvider.jsx";
import { usePeer } from "../provider/Peer.jsx";

function RoomPage() {
  const { socket } = useSocket();
  const { 
    peer, 
    createOffer, 
    createAnswer, 
    setRemoteAnswer, 
    remoteStream, 
    sendStream, 
    getIceCandidates,
    connectionState,
    iceConnectionState 
  } = usePeer();
  
  const [myStream, setMyStream] = useState(null);
  const [remoteEmailId, setRemoteEmailId] = useState(null);
  const [localStreamStatus, setLocalStreamStatus] = useState('Not sent');
  const [remoteStreamStatus, setRemoteStreamStatus] = useState('Not received');

  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  if (!socket) {
    return <div>Connecting to socket...</div>;
  }

  const handleNewUserJoined = useCallback(async (data) => {
    const { emailId } = data;
    if (!emailId) {
      console.error("Email ID is undefined in handleNewUserJoined");
      return;
    }
    console.log(`New User ${emailId} Joined!`);
    const offer = await createOffer();
    const iceCandidates = getIceCandidates();
    socket.emit("call-user", { 
      emailId, 
      offer,
      iceCandidates 
    });
    setRemoteEmailId(emailId);
    console.log(`Calling user ${emailId} with offer and ICE candidates`);
  }, [createOffer, socket, getIceCandidates]);

  const handleIncomingCall = useCallback(async (data) => {
    const { fromEmail, offer, iceCandidates } = data;
    if (!fromEmail) {
      console.error("fromEmail is undefined in handleIncomingCall");
      return;
    }
    console.log(`Incoming call from ${fromEmail}`);
    try {
      // Add received ICE candidates
      if (iceCandidates) {
        for (const candidate of iceCandidates) {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }

      const ans = await createAnswer(offer);
      socket.emit("call-accepted", { 
        emailId: fromEmail, 
        ans,
        iceCandidates: getIceCandidates()
      });
      setRemoteEmailId(fromEmail);
      console.log("Call accepted with answer and ICE candidates");
    } catch (error) {
      console.error("Error handling incoming call:", error);
    }
  }, [createAnswer, socket, peer, getIceCandidates]);

  const handleAcceptedCall = useCallback(async (data) => {
    const { ans, iceCandidates } = data;
    console.log("Call accepted, setting remote answer and ICE candidates");
    try {
      await setRemoteAnswer(ans);
      
      // Add received ICE candidates
      if (iceCandidates) {
        for (const candidate of iceCandidates) {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }
      console.log("Remote answer and ICE candidates set successfully");
    } catch (error) {
      console.error("Error setting remote answer or ICE candidates:", error);
    }
  }, [setRemoteAnswer, peer]);

  // Get user media stream
  const getUserMediaStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });
      setMyStream(stream);
      const sendSuccess = await sendStream(stream);
      setLocalStreamStatus(sendSuccess ? 'Sent successfully' : 'Failed to send');
      console.log('Local stream tracks:', stream.getTracks());
    } catch (error) {
      console.error("Error getting user media:", error);
      setLocalStreamStatus('Error getting media');
    }
  }, [sendStream]);

  // Set up socket event listeners
  useEffect(() => {
    socket.on("user-joined", handleNewUserJoined);
    socket.on("incoming-call", async (data) => {
      console.log("Incoming call event received:", JSON.stringify(data));
      await handleIncomingCall(data);
    });
    socket.on("call-accepted", async (data) => {
      console.log("Call accepted event received:", JSON.stringify(data));
      await handleAcceptedCall(data);
    });

    return () => {
      socket.off("user-joined");
      socket.off("incoming-call");
      socket.off("call-accepted");
    };
  }, [socket, handleNewUserJoined, handleIncomingCall, handleAcceptedCall]);

  // Get user media on component mount
  useEffect(() => {
    getUserMediaStream();
  }, [getUserMediaStream]);

  // Set local video stream
  useEffect(() => {
    if (myStream && myVideoRef.current) {
      console.log("Setting local video stream");
      myVideoRef.current.srcObject = myStream;
    }
  }, [myStream]);

  // Set remote video stream
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      setRemoteStreamStatus('Received successfully');
      console.log('Remote stream tracks:', remoteStream.getTracks());
    }
  }, [remoteStream]);

  return (
    <div className="RoomPage-container">
      <h1>Room Page</h1>

      <div style={{ display: "flex", gap: "20px" }}>
        <div>
          <h2>My Video</h2>
          <video 
            ref={myVideoRef} 
            autoPlay 
            muted 
            playsInline 
            style={{ width: "300px", border: "1px solid black" }} 
          />
        </div>

        <div>
          <h2>Remote Video</h2>
          <h4>{remoteEmailId ? `You are connected to ${remoteEmailId}` : 'No connection yet'}</h4>
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            style={{ width: "300px", border: "1px solid black" }} 
          />
        </div>

        <div>
          <h2>Connection Status</h2>
          <p>Local stream: {localStreamStatus}</p>
          <p>Remote stream: {remoteStreamStatus}</p>
          <p>ICE State: {iceConnectionState}</p>
          <p>Connection State: {connectionState}</p>
        </div>
      </div>
    </div>
  );
}

export default RoomPage;