import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import workingRouter from './Routes/auth.routes.js';
import chatRouter from './Routes/chat.routes.js';
import { Server } from 'socket.io';


const app = express();
const server= http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static("public"))
app.use(cookieParser())
app.use("/api/v1/users", workingRouter);
app.use("/api/v1", chatRouter);

io.on("connection", (socket) => {
    console.log("User Connected with id", socket.id);
    socket.on("join_room", (roomId) => {
        socket.join(roomId);
        io.to(roomId).emit("room_joined", {
            user: socket.id,
            room: roomId,
            message: `User ${socket.id} joined room ${roomId}`
        });
    });
    socket.on("new_message", (data) => {
        const { message } = data;
        io.emit("receive_message", {
            user: socket.id,
            message,
            timestamp: new Date()
        });
        const clients = Array.from(io.sockets.sockets.keys());
        io.emit("connected_users", {
            users: clients
        });
    });
    socket.on("send_message", (data) => {
        const { room, message } = data;
        io.to(room).emit("receive_message", {
            user: socket.id,
            message,
            room,
            timestamp: new Date()
        });
    });
    socket.on("private_message", (data) => {
        const { recipientId, message } = data;
        io.to(recipientId).emit("new_private_message", {
            from: socket.id,
            message,
            timestamp: new Date()
        });
    });
    socket.on("disconnect", () => {
        console.log("User Disconnected:", socket.id);
    });
});

export {
    app,
    server,
    io
}