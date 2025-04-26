import React, { useCallback, useEffect, useState } from "react";
import { useSocket } from "../provider/SocketProvider";
import { useNavigate } from "react-router-dom";

function HomePage() {
  const {socket }= useSocket();
  const [email, setEmail] = useState("");
  const [roomId, setRoomId] = useState("");

  const navigate = useNavigate();

  const handleJoinedRoom = useCallback(({roomId}) => {
    console.log("joined the room ",roomId);
    navigate(`/room/${roomId}`)
  },[navigate])

  useEffect(()=>{
    socket.on("joined-room",handleJoinedRoom);
    return () =>{
      socket.off("joined-room",handleJoinedRoom);
    }
  },[handleJoinedRoom, socket])

  const handleJoinRoom = () => {
    if (socket) {
      socket.emit("join-room", { roomId, emailId: email });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-300 rounded-xl p-6 space-y-6">
        <h1 className="text-3xl font-bold text-gray-800 text-center">Welcome</h1>
        
        <fieldset className="">
          <legend className="px-2 text-sm font-medium text-gray-700">What is your email?</legend>
          <input
            type="email"
            className="w-full px-3 py-2 border rounded-md text-black"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {/* <p className="text-xs text-gray-500 text-right mt-1">Optional</p> */}
        </fieldset>

        {/* <fieldset className="">
          <legend className="px-2 text-sm font-medium text-gray-700">Enter room code</legend>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. ABC123"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <p className="text-xs text-gray-500 text-right mt-1">Optional</p>
        </fieldset> */}
        <fieldset className="">
          <legend className="px-2 text-sm font-medium text-gray-700">What is your room id?</legend>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-md text-black"
            placeholder="e.g. ABC123"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          {/* <p className="text-xs text-gray-500 text-right mt-1">Optional</p> */}
        </fieldset>

        <button 
          className="w-full bg-amber-800 text-black font-medium py-2 px-4 rounded-md transition duration-200"
          onClick={handleJoinRoom}
        >
          Enter Room
        </button>
      </div>
    </div>
  );
}

export default HomePage;