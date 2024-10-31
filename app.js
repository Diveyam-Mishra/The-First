import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import workingRouter from './Routes/auth.routes.js';
import { Server } from 'socket.io';


const app = express();
const server= http.createServer(app);
const io= new Server(server,{
    cors:({origin: "*",
        methods:["GET", "POST"],
        credentials: true,
    }
)}

);

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static("public"))
app.use(cookieParser())

app.use("/api/v1/users", workingRouter);
app.use("/api/v1/chat", chatRouter); // Use the chat routes

io.on("connection",(socket)=>{
    console.log("User Connected with id",socket.id);
})

export {app,server,io}