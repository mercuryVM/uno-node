const httpServer = require("http").createServer();
const io = require("socket.io")(httpServer, {
  
});

const uuid = require('uuid');

const minUsersStart = 1;
const playerNumberCards = 7;

function randomNumber(min, max){
  return Math.floor((Math.random() * (max - min + 1)) + min);
}

class Carta {
  constructor(color, number){
    this.number = number;
    this.color = color;
  }

  id(){
    let formatColor = "NaN";

    switch(this.color){
      case 0: formatColor = "r"; break;
      case 1: formatColor = "g"; break;
      case 2: formatColor = "b"; break;
      case 3: formatColor = "y"; break;
    }

    return formatColor + "" + this.number;
  }
}

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

  UserArray(){
    let iterator = this.users.values();
    let arr = [];

    for(let i = 0; i < this.users.size; i++){
     arr.push(iterator.next()); 
    }

    return arr;
  }

  GetClientCards(user){
    let arr = [];
    for(let i = 0; i < user.cards.length; i++){
      arr.push(user.cards[i].id());
    }

    return arr;
  }

  GiveCardsToEveryone(){
    let everyone = this.UserArray();

    for(let i = 0; i < everyone.length; i++){
      let user = everyone[i].value;
      if(!user.cards) user.cards = [];
      for(let i2 = 0; i2 < playerNumberCards; i2++){
        user.cards.push(this.GetRandomCard());
      }

      user.emit("show cards", this.GetClientCards(user));
    }
  }

  StartMatch(){
    this.GiveCardsToEveryone();
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

          this.StartMatch();

        }
      }, 1000)
    }else{
      io.to(this.roomID).emit("left", minUsersStart - this.users.size);
    }
  }

  GetRandomCard(){
    let color = randomNumber(0, 3);
    let number = randomNumber(1, 9);

    return new Carta(color, number);
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