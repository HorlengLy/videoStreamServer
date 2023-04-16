const express = require('express');
const app = express();
const http = require('http');
const {Server} = require("socket.io");
const cors = require('cors');
app.use(cors());
const server = http.createServer(app);
const io = new Server(server,{
    cors:{
        origin:["http://localhost:5173","https://videocaller.netlify.app/"],
        methods:["GET","POST"]
        },
});
server.listen(5000,()=>console.log("http://localhost:5000"));
app.get('/',(req,res)=>{
    res.json({ms:"Hello, world!"});
})

// socket connection


var Rooms = [];


io.on('connection',socket=>{
    socket.join(socket.id)
    socket.emit('ms',{ms:"Hello, world!"});
    
    socket.on("joinRoom",({username,room,peerId,isJoin})=>{
        if(isJoin)
            addMember(username,room,peerId,socket);
        else 
            makeRoom(username,room,peerId,socket);
        socket.broadcast.to(room).emit('userJoinedRoom',{username,peerId})
        socket.on('disconnect',()=>{
            removeMemmber(room,socket);
            socket.to(room).emit("user-left",peerId)
        })
        socket.on('changeScreen',({room,peerId})=>{
            console.log({room,peerId});
            socket.broadcast.to(room).emit('screenChenged',peerId)
        })
        
    })
    
})

function removeMemmber(room,socket){
    let location = Rooms.find(rooms=>rooms.room === room)
    if(!location) return
    location.members = location.members?.filter(member=>member.socketId!==socket.id)
    if(!location.members?.length) 
        Rooms = Rooms.filter(rooms=>rooms.room!==room) 
}

function addMember(username,room,peerId,socket){
    let location = Rooms.find(rooms=>rooms.room==room)
    if(!location) {
        console.log("room isn't create yet!");
        return socket.emit("response",{ms:"room isn't create yet!",room,success:false});
    }
    if(location.members?.find(member=>member.socketId===socket.id)) return
    location.members.push({username,peerId,socketId:socket.id})
    socket.join(room)
    socket.emit("response",{ms:"",room,success:true});
    let rooms = Rooms.find(r=>r.room = room)
    socket.nsp.in(room).emit('getRoom',rooms)
}

function makeRoom(username,room,peerId,socket){
    if(Rooms.find(room=>room.room==room))
        return socket.emit("response",{ms:"room is already exist",room,success:false});
    Rooms.push({room,owner:socket.id,members:[{username,peerId,socketId:socket.id}]})
    socket.join(room);
    socket.emit("response",{ms:"",room,success:true});
}