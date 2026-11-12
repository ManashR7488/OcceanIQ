import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { 
  FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff, 
  FiMessageSquare, FiSend, FiX, FiUsers
} from 'react-icons/fi';

const Meeting = () => {
  const { meetingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const userName = location.state?.userName || 'User ' + Math.floor(Math.random() * 1000);

  const [stream, setStream] = useState(null);
  const [peers, setPeers] = useState([]); // Array of { peerId, stream }
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [showChat, setShowChat] = useState(false);

  const myVideoRef = useRef();
  const socketRef = useRef();
  const peersRef = useRef({}); // Map of peerId -> RTCPeerConnection
  const streamRef = useRef();

  // STUN servers for NAT traversal
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ]
  };

  useEffect(() => {
    // 1. Initialize Socket
    socketRef.current = io('http://localhost:5000');

    // 2. Get User Media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        streamRef.current = currentStream;
        if (myVideoRef.current) {
          myVideoRef.current.srcObject = currentStream;
        }

        // 3. Join Room
        socketRef.current.emit('join-room', meetingId, socketRef.current.id, userName);

        // 4. Handle New User Connected (Initiate Offer)
        socketRef.current.on('user-connected', (userId, remoteUserName) => {
          console.log('User connected:', userId);
          createPeer(userId, socketRef.current.id, currentStream);
        });

        // 5. Handle Receiving Offer (Send Answer)
        socketRef.current.on('offer', handleReceiveOffer);

        // 6. Handle Receiving Answer
        socketRef.current.on('answer', handleReceiveAnswer);

        // 7. Handle ICE Candidates
        socketRef.current.on('ice-candidate', handleNewICECandidate);

        // 8. Handle User Disconnect
        socketRef.current.on('user-disconnected', (userId) => {
          if (peersRef.current[userId]) {
            peersRef.current[userId].close();
            delete peersRef.current[userId];
          }
          setPeers((prev) => prev.filter((p) => p.peerId !== userId));
        });

        // 9. Handle Chat Messages
        socketRef.current.on('receive-message', (message) => {
          setMessages((prev) => [...prev, message]);
        });
      })
      .catch((err) => console.error('Error accessing media devices:', err));

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      socketRef.current.disconnect();
    };
  }, [meetingId]);

  // --- WebRTC Functions ---

  const createPeer = (targetId, initiatorId, stream) => {
    const peer = new RTCPeerConnection(rtcConfig);
    peersRef.current[targetId] = peer;

    // Add local tracks to peer
    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    // Handle ICE candidates
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('ice-candidate', {
          target: targetId,
          candidate: event.candidate,
          caller: socketRef.current.id
        });
      }
    };

    // Handle remote stream
    peer.ontrack = (event) => {
      setPeers((prev) => {
        if (!prev.find(p => p.peerId === targetId)) {
          return [...prev, { peerId: targetId, stream: event.streams[0] }];
        }
        return prev;
      });
    };

    // Create Offer
    peer.createOffer()
      .then(offer => peer.setLocalDescription(offer))
      .then(() => {
        socketRef.current.emit('offer', {
          target: targetId,
          caller: initiatorId,
          sdp: peer.localDescription
        });
      });
  };

  const handleReceiveOffer = (payload) => {
    const peer = new RTCPeerConnection(rtcConfig);
    peersRef.current[payload.caller] = peer;

    // Add local tracks
    streamRef.current.getTracks().forEach(track => peer.addTrack(track, streamRef.current));

    // Handle ICE
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('ice-candidate', {
          target: payload.caller,
          candidate: event.candidate,
          caller: socketRef.current.id
        });
      }
    };

    // Handle remote stream
    peer.ontrack = (event) => {
      setPeers((prev) => {
        if (!prev.find(p => p.peerId === payload.caller)) {
          return [...prev, { peerId: payload.caller, stream: event.streams[0] }];
        }
        return prev;
      });
    };

    // Set Remote & Create Answer
    peer.setRemoteDescription(new RTCSessionDescription(payload.sdp))
      .then(() => peer.createAnswer())
      .then(answer => peer.setLocalDescription(answer))
      .then(() => {
        socketRef.current.emit('answer', {
          target: payload.caller,
          caller: socketRef.current.id,
          sdp: peer.localDescription
        });
      });
  };

  const handleReceiveAnswer = (payload) => {
    const peer = peersRef.current[payload.caller];
    if (peer) {
      peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    }
  };

  const handleNewICECandidate = (payload) => {
    const peer = peersRef.current[payload.caller];
    if (peer) {
      peer.addIceCandidate(new RTCIceCandidate(payload.candidate))
        .catch(e => console.error("Error adding ICE candidate:", e));
    }
  };

  // --- Chat Functions ---
  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const msgData = {
        userId: socketRef.current.id,
        userName: userName,
        message: newMessage,
        timestamp: new Date().toISOString(),
      };
      // Send to server
      socketRef.current.emit('send-message', meetingId, newMessage, userName);
      // Add to local (server broadcasts to everyone including sender? No, usually excludes sender. Let's check socketHandler)
      // socketHandler: io.to(roomId).emit... -> includes sender.
      // So I don't need to add it manually if server sends back to me.
      setNewMessage('');
    }
  };

  // --- Controls ---
  const toggleMic = () => {
    const enabled = !isMicOn;
    streamRef.current.getAudioTracks()[0].enabled = enabled;
    setIsMicOn(enabled);
  };

  const toggleVideo = () => {
    const enabled = !isVideoOn;
    streamRef.current.getVideoTracks()[0].enabled = enabled;
    setIsVideoOn(enabled);
  };

  const leaveMeeting = () => {
    navigate('/app/connect');
  };

  return (
    <div className="flex h-full w-full bg-[#202124] text-white overflow-hidden relative">
      
      {/* Video Grid */}
      <div className={`flex-1 flex flex-wrap items-center justify-center p-4 gap-4 ${showChat ? 'mr-80' : ''}`}>
        {/* My Video */}
        <div className="relative w-full max-w-[600px] aspect-video bg-[#3c4043] rounded-lg overflow-hidden shadow-lg">
          <video ref={myVideoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
          <div className="absolute bottom-4 left-4 bg-black/40 px-3 py-1 rounded text-sm font-medium">You ({userName})</div>
        </div>

        {/* Remote Videos */}
        {peers.map((peer) => (
          <VideoPlayer key={peer.peerId} stream={peer.stream} />
        ))}
      </div>

      {/* Controls Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-[#202124] flex items-center justify-center gap-4 border-t border-gray-700/30 z-10">
        <button onClick={toggleMic} className={`p-4 rounded-full ${isMicOn ? 'bg-[#3c4043] hover:bg-[#4d5155]' : 'bg-red-600'}`}>
          {isMicOn ? <FiMic size={20} /> : <FiMicOff size={20} />}
        </button>
        <button onClick={toggleVideo} className={`p-4 rounded-full ${isVideoOn ? 'bg-[#3c4043] hover:bg-[#4d5155]' : 'bg-red-600'}`}>
          {isVideoOn ? <FiVideo size={20} /> : <FiVideoOff size={20} />}
        </button>
        <button onClick={leaveMeeting} className="p-4 rounded-full bg-red-600 hover:bg-red-700 px-8">
          <FiPhoneOff size={20} />
        </button>
        <button onClick={() => setShowChat(!showChat)} className={`p-4 rounded-full ${showChat ? 'bg-blue-600' : 'bg-[#3c4043] hover:bg-[#4d5155]'}`}>
          <FiMessageSquare size={20} />
        </button>
      </div>

      {/* Chat Sidebar */}
      {showChat && (
        <div className="absolute top-0 right-0 bottom-20 w-80 bg-white text-gray-800 shadow-xl flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">In-call messages</h3>
            <button onClick={() => setShowChat(false)}><FiX /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.userId === socketRef.current.id ? 'items-end' : 'items-start'}`}>
                <div className="text-xs text-gray-500 mb-1">{msg.userName}</div>
                <div className={`px-3 py-2 rounded-lg max-w-[80%] ${
                  msg.userId === socketRef.current.id ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-800'
                }`}>
                  {msg.message}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
            <input 
              type="text" 
              value={newMessage} 
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Send a message..."
              className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="p-2 text-blue-600 hover:bg-blue-50 rounded-full">
              <FiSend size={20} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

const VideoPlayer = ({ stream }) => {
  const ref = useRef();
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return (
    <div className="relative w-full max-w-[600px] aspect-video bg-[#3c4043] rounded-lg overflow-hidden shadow-lg">
      <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" />
    </div>
  );
};

export default Meeting;
