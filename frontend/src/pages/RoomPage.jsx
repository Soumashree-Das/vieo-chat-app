// import React, { useCallback, useEffect, useRef, useState } from "react";
// import { useSocket } from "../provider/SocketProvider.jsx";
// import { usePeer } from "../provider/Peer.jsx";

// function RoomPage() {
//   const { socket } = useSocket();
//   const { 
//     peer, 
//     createOffer, 
//     createAnswer, 
//     setRemoteAnswer, 
//     remoteStream, 
//     sendStream, 
//     getIceCandidates,
//     connectionState,
//     iceConnectionState 
//   } = usePeer();
  
//   const [myStream, setMyStream] = useState(null);
//   const [remoteEmailId, setRemoteEmailId] = useState(null);
//   const [localStreamStatus, setLocalStreamStatus] = useState('Not sent');
//   const [remoteStreamStatus, setRemoteStreamStatus] = useState('Not received');

//   const myVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);

//   if (!socket) {
//     return <div>Connecting to socket...</div>;
//   }

//   const handleNewUserJoined = useCallback(async (data) => {
//     const { emailId } = data;
//     if (!emailId) {
//       console.error("Email ID is undefined in handleNewUserJoined");
//       return;
//     }
//     console.log(`New User ${emailId} Joined!`);
//     const offer = await createOffer();
//     const iceCandidates = getIceCandidates();
//     socket.emit("call-user", { 
//       emailId, 
//       offer,
//       iceCandidates 
//     });
//     setRemoteEmailId(emailId);
//     console.log(`Calling user ${emailId} with offer and ICE candidates`);
//   }, [createOffer, socket, getIceCandidates]);

//   const handleIncomingCall = useCallback(async (data) => {
//     const { fromEmail, offer, iceCandidates } = data;
//     if (!fromEmail) {
//       console.error("fromEmail is undefined in handleIncomingCall");
//       return;
//     }
//     console.log(`Incoming call from ${fromEmail}`);
//     try {
//       // Add received ICE candidates
//       if (iceCandidates) {
//         for (const candidate of iceCandidates) {
//           await peer.addIceCandidate(new RTCIceCandidate(candidate));
//         }
//       }

//       const ans = await createAnswer(offer);
//       socket.emit("call-accepted", { 
//         emailId: fromEmail, 
//         ans,
//         iceCandidates: getIceCandidates()
//       });
//       setRemoteEmailId(fromEmail);
//       console.log("Call accepted with answer and ICE candidates");
//     } catch (error) {
//       console.error("Error handling incoming call:", error);
//     }
//   }, [createAnswer, socket, peer, getIceCandidates]);

//   const handleAcceptedCall = useCallback(async (data) => {
//     const { ans, iceCandidates } = data;
//     console.log("Call accepted, setting remote answer and ICE candidates");
//     try {
//       await setRemoteAnswer(ans);
      
//       // Add received ICE candidates
//       if (iceCandidates) {
//         for (const candidate of iceCandidates) {
//           await peer.addIceCandidate(new RTCIceCandidate(candidate));
//         }
//       }
//       console.log("Remote answer and ICE candidates set successfully");
//     } catch (error) {
//       console.error("Error setting remote answer or ICE candidates:", error);
//     }
//   }, [setRemoteAnswer, peer]);

//   // Get user media stream
//   const getUserMediaStream = useCallback(async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         audio: true,
//         video: true
//       });
//       setMyStream(stream);
//       const sendSuccess = await sendStream(stream);
//       setLocalStreamStatus(sendSuccess ? 'Sent successfully' : 'Failed to send');
//       console.log('Local stream tracks:', stream.getTracks());
//     } catch (error) {
//       console.error("Error getting user media:", error);
//       setLocalStreamStatus('Error getting media');
//     }
//   }, [sendStream]);

//   // Set up socket event listeners
//   useEffect(() => {
//     socket.on("user-joined", handleNewUserJoined);
//     socket.on("incoming-call", async (data) => {
//       console.log("Incoming call event received:", JSON.stringify(data));
//       await handleIncomingCall(data);
//     });
//     socket.on("call-accepted", async (data) => {
//       console.log("Call accepted event received:", JSON.stringify(data));
//       await handleAcceptedCall(data);
//     });

//     return () => {
//       socket.off("user-joined");
//       socket.off("incoming-call");
//       socket.off("call-accepted");
//     };
//   }, [socket, handleNewUserJoined, handleIncomingCall, handleAcceptedCall]);

//   // Get user media on component mount
//   useEffect(() => {
//     getUserMediaStream();
//   }, [getUserMediaStream]);

//   // Set local video stream
//   useEffect(() => {
//     if (myStream && myVideoRef.current) {
//       console.log("Setting local video stream");
//       myVideoRef.current.srcObject = myStream;
//     }
//   }, [myStream]);

//   // Set remote video stream
//   useEffect(() => {
//     if (remoteStream && remoteVideoRef.current) {
//       remoteVideoRef.current.srcObject = remoteStream;
//       setRemoteStreamStatus('Received successfully');
//       console.log('Remote stream tracks:', remoteStream.getTracks());
//     }
//   }, [remoteStream]);

//   return (
//     <div className="RoomPage-container">
//       <h1>Room Page</h1>

//       <div style={{ display: "flex", gap: "20px" }}>
//         <div>
//           <h2>My Video</h2>
//           <video 
//             ref={myVideoRef} 
//             autoPlay 
//             muted 
//             playsInline 
//             style={{ width: "300px", border: "1px solid black" }} 
//           />
//         </div>

//         <div>
//           <h2>Remote Video</h2>
//           <h4>{remoteEmailId ? `You are connected to ${remoteEmailId}` : 'No connection yet'}</h4>
//           <video 
//             ref={remoteVideoRef} 
//             autoPlay 
//             playsInline 
//             style={{ width: "300px", border: "1px solid black" }} 
//           />
//         </div>

//         <div>
//           <h2>Connection Status</h2>
//           <p>Local stream: {localStreamStatus}</p>
//           <p>Remote stream: {remoteStreamStatus}</p>
//           <p>ICE State: {iceConnectionState}</p>
//           <p>Connection State: {connectionState}</p>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default RoomPage;
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSocket } from "../provider/SocketProvider.jsx";
import { usePeer } from "../provider/Peer.jsx";
import { useParams } from "react-router-dom";

function RoomPage() {
  const { roomId } = useParams();
  const { socket } = useSocket();
  const { 
    peer, 
    createOffer, 
    createAnswer, 
    setRemoteAnswer, 
    remoteStream, 
    sendStream, 
    getIceCandidates,
    addIceCandidate,
    restartIce,
    connectionState,
    iceConnectionState 
  } = usePeer();
  
  const [myStream, setMyStream] = useState(null);
  const [remoteEmailId, setRemoteEmailId] = useState(null);
  const [localStreamStatus, setLocalStreamStatus] = useState('Not sent');
  const [remoteStreamStatus, setRemoteStreamStatus] = useState('Not received');
  const [isNegotiating, setIsNegotiating] = useState(false);
  
  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const handleNewUserJoined = useCallback(async (data) => {
    const { emailId } = data;
    if (!emailId) {
      console.error("Email ID is undefined in handleNewUserJoined");
      return;
    }
    console.log(`New User ${emailId} Joined!`);
    setRemoteEmailId(emailId);
    
    try {
      setIsNegotiating(true);
      const offer = await createOffer();
      socket.emit("call-user", { 
        emailId, 
        offer,
        iceCandidates: getIceCandidates(),
        roomId
      });
      console.log(`Calling user ${emailId} with offer`);
    } catch (error) {
      console.error("Error creating offer:", error);
    } finally {
      setIsNegotiating(false);
    }
  }, [createOffer, socket, getIceCandidates, roomId]);

  const handleIncomingCall = useCallback(async (data) => {
    const { fromEmail, offer, iceCandidates } = data;
    if (!fromEmail) {
      console.error("fromEmail is undefined in handleIncomingCall");
      return;
    }
    console.log(`Incoming call from ${fromEmail}`);
    setRemoteEmailId(fromEmail);
    
    try {
      setIsNegotiating(true);
      // Add received ICE candidates after setting remote description
      const ans = await createAnswer(offer);
      
      // Now add ICE candidates
      if (iceCandidates && Array.isArray(iceCandidates)) {
        console.log(`Received ${iceCandidates.length} ICE candidates from caller`);
        for (const candidate of iceCandidates) {
          await addIceCandidate(candidate);
        }
      }
      
      socket.emit("call-accepted", { 
        emailId: fromEmail, 
        ans,
        iceCandidates: getIceCandidates(),
        roomId
      });
      console.log("Call accepted with answer");
    } catch (error) {
      console.error("Error handling incoming call:", error);
    } finally {
      setIsNegotiating(false);
    }
  }, [createAnswer, socket, addIceCandidate, getIceCandidates, roomId]);

  const handleAcceptedCall = useCallback(async (data) => {
    const { ans, iceCandidates } = data;
    console.log("Call accepted, setting remote answer");
    
    try {
      setIsNegotiating(true);
      await setRemoteAnswer(ans);
      
      // Add received ICE candidates after setting remote answer
      if (iceCandidates && Array.isArray(iceCandidates)) {
        console.log(`Received ${iceCandidates.length} ICE candidates from callee`);
        for (const candidate of iceCandidates) {
          await addIceCandidate(candidate);
        }
      }
      console.log("Remote answer set successfully");
    } catch (error) {
      console.error("Error setting remote answer:", error);
    } finally {
      setIsNegotiating(false);
    }
  }, [setRemoteAnswer, addIceCandidate]);

  // Handle ICE candidate reception
  const handleIceCandidate = useCallback(async (data) => {
    const { candidate, fromEmail } = data;
    if (remoteEmailId !== fromEmail) return;
    
    console.log("Received ICE candidate from remote peer");
    try {
      await addIceCandidate(candidate);
    } catch (error) {
      console.error("Error adding received ICE candidate:", error);
    }
  }, [addIceCandidate, remoteEmailId]);

  // Get user media stream
  const getUserMediaStream = useCallback(async () => {
    try {
      console.log("Getting user media");
      const constraints = {
        audio: true,
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setMyStream(stream);
      
      console.log("Got local stream, sending to peer connection");
      const sendSuccess = await sendStream(stream);
      setLocalStreamStatus(sendSuccess ? 'Sent successfully' : 'Failed to send');
      console.log('Local stream tracks:', stream.getTracks().map(t => `${t.kind}:${t.id}:${t.enabled}`));
    } catch (error) {
      console.error("Error getting user media:", error);
      setLocalStreamStatus(`Error: ${error.message}`);
    }
  }, [sendStream]);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;
    
    console.log("Setting up socket event listeners in room:", roomId);
    
    socket.on("user-joined", handleNewUserJoined);
    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleAcceptedCall);
    socket.on("ice-candidate", handleIceCandidate);
    
    // Announce our presence in the room
    socket.emit("join-room", { 
      roomId, 
      emailId: localStorage.getItem("emailId") || "anonymous" 
    });

    return () => {
      socket.off("user-joined", handleNewUserJoined);
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleAcceptedCall);
      socket.off("ice-candidate", handleIceCandidate);
    };
  }, [
    socket, 
    handleNewUserJoined, 
    handleIncomingCall, 
    handleAcceptedCall, 
    handleIceCandidate, 
    roomId
  ]);

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
      console.log("Setting remote video stream");
      remoteVideoRef.current.srcObject = remoteStream;
      setRemoteStreamStatus('Received successfully');
      
      // Log remote tracks
      const remoteTracks = remoteStream.getTracks();
      console.log(`Remote stream has ${remoteTracks.length} tracks:`, 
        remoteTracks.map(t => `${t.kind}:${t.id}:${t.enabled}`));
    }
  }, [remoteStream]);

  // Monitor and update remote stream status
  useEffect(() => {
    if (!remoteStream && iceConnectionState === 'connected') {
      setRemoteStreamStatus('Connected but no stream received');
    } else if (!remoteStream && iceConnectionState === 'failed') {
      setRemoteStreamStatus('Connection failed');
    } else if (!remoteStream) {
      setRemoteStreamStatus('Not received');
    }
  }, [remoteStream, iceConnectionState]);

  // Function to restart ICE if needed
  const handleRestartConnection = async () => {
    if (isNegotiating) return;
    
    try {
      setIsNegotiating(true);
      console.log("Manually restarting connection");
      const offer = await restartIce();
      
      if (remoteEmailId) {
        socket.emit("call-user", { 
          emailId: remoteEmailId, 
          offer, 
          iceCandidates: getIceCandidates(),
          roomId,
          restart: true
        });
      }
    } catch (error) {
      console.error("Error restarting connection:", error);
    } finally {
      setIsNegotiating(false);
    }
  };

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
          <p>Negotiating: {isNegotiating ? 'Yes' : 'No'}</p>
          
          <button 
            onClick={handleRestartConnection} 
            disabled={isNegotiating}
            style={{ 
              padding: "8px 16px", 
              marginTop: "10px",
              backgroundColor: isNegotiating ? "#ccc" : "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isNegotiating ? "not-allowed" : "pointer"
            }}
          >
            Restart Connection
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoomPage;
