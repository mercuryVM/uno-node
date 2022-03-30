const httpServer = require("http").createServer();
const io = require("socket.io")(httpServer, {
  
});

const uuid = require('uuid');

const minUsersStart = 1;

class Room {
  constructor(roomID){
    this.roomID = roomID;
    this.users = new Map();
  }

  JoinUser(userID, socket){
    if(this.users.has(userID)) socket.disconnect();
    else {
      this.users.set(userID, socket);

      io.to(this.roomID).emit("join", socket.data);

      this.CanStart();
    }
  }

  CanStart(){
    if(this.users.size >= minUsersStart){
      let countdown = 20;
      io.to(this.roomID).emit("starting", countdown);
      let timer = setInterval(() => {
        if(countdown <= 10) io.to(this.roomID).emit("starting", countdown)
        countdown--;
        if(countdown == 0) {
          clearInterval(timer);
        }
      }, 1000)
    }else{
      io.to(this.roomID).emit("left", minUsersStart - this.users.size);
    }
  }
}

let rooms = new Map();

io.on("connection", (socket) => {
  const {roomID, name} = socket.handshake.query;

  if(!roomID || !name) {
    socket.disconnect();
    return;
  }

  if(!rooms.has(roomID)) rooms.set(roomID, new Room(roomID));

  const currentRoom = rooms.get(roomID);
  const uniqueID = uuid.v4();

  socket.data = {
    uniqueID,
    name
  }

  socket.join(roomID);

  currentRoom.JoinUser(uniqueID, socket);
});

httpServer.listen(3000);