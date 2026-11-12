import { Server } from "socket.io";

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*", // Allow all origins for development
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-room", (roomId, userId, userName) => {
      socket.join(roomId);
      console.log(`User ${userId} (${userName}) joined room ${roomId}`);
      
      // Broadcast to others in the room that a new user connected
      socket.to(roomId).emit("user-connected", userId, userName);

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        socket.to(roomId).emit("user-disconnected", userId);
      });
    });

    // Signaling events for WebRTC
    socket.on("offer", (payload) => {
      io.to(payload.target).emit("offer", payload);
    });

    socket.on("answer", (payload) => {
      io.to(payload.target).emit("answer", payload);
    });

    socket.on("ice-candidate", (payload) => {
      io.to(payload.target).emit("ice-candidate", payload);
    });

    // Chat messages
    socket.on("send-message", (roomId, message, userName) => {
      io.to(roomId).emit("receive-message", {
        userId: socket.id,
        userName,
        message,
        timestamp: new Date().toISOString(),
      });
    });
  });

  return io;
};

export default setupSocket;
