const httpServer = require("http").createServer();
const io = require("socket.io")(httpServer, {
  
});

const uuid = require('uuid');

const minUsersStart = 2;
const playerNumberCards = 1;
const numOfSameCardsPerDeck = 2;
const numOfDrawFourPerDeck = 4;
const numOfDrawTwoPerDeck = 8;
const numOfWildPerDeck = 8;
const countdownToStart = 20;

function shuffleArr(array) {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

function getRandomDeck(){
  let deck = [];

  deck.push(new Carta(0, 1));

  //deck

  for(let i = 0; i < numOfSameCardsPerDeck; i++){
    for(let color = 0; color < 4; color ++){
      for(let number = 1; number <= 9; number++){
        deck.push(new Carta(color, number));
      }
    }
  }

  //+4
  for(let i = 0; i < numOfDrawFourPerDeck; i++){
    deck.push(new Carta(4, 4));
  }

  //+2
  for(let i = 0; i < numOfDrawTwoPerDeck; i++){
    deck.push(new Carta(4, 2));
  }

    //wild
    for(let i = 0; i < numOfWildPerDeck; i++){
      deck.push(new Carta(5, 0));
    }

  for(let shuffle = 0; shuffle < 2; shuffle++){
    deck = shuffleArr(deck);
  }

  console.log(deck);

  return deck;
}

function randomNumber(min, max){
  return Math.floor((Math.random() * (max - min + 1)) + min);
}

function ConvertCard(color, number){
  let formatColor = -1;
  
  switch(color){
    case "r": formatColor = 0; break;
    case "g": formatColor = 1; break;
    case "b": formatColor = 2; break;
    case "y": formatColor = 3; break;
    case "+": formatColor = 4; break;
    case "w": formatColor = 5; break;
  }

  return new Carta(formatColor, number);
}

function Timeout(ms){
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, ms);
  })
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
      case 4: formatColor = "+"; break;
      case 5: formatColor = "w"; break;
    }

    return formatColor + "" + this.number;
  }
}

class Room {
  constructor(roomID){
    this.roomID = roomID;
    this.users = new Map();
    this.currentCard = false;
    this.currentTurn = 0;
    this.started = false;
    this.roomDeck = false;
    this.roomDeckIndex = 0;
  }

  JoinUser(userID, socket){
    if(this.users.has(userID)) socket.disconnect();
    else {
      this.users.set(userID, socket);

      this.emit("join", socket.data, this.started);

      if(this.started){
        socket.spectating = true;
      }else{
        socket.spectating = false;
      }

      this.CanStart();
    }
  }

  DisconnectUser(socket){
    if(socket.data){
      this.users.delete(socket.data.uniqueID);
      this.emit("disconnected", socket.data);

      this.CheckDraw();
    }
  }

  emit(eventName, ...args){
    io.to(this.roomID).emit(eventName, ...args);
  }

  emitExclude(socket, eventName, ...args){
    if(socket) socket.to(this.roomID).emit(eventName, ...args);
  }

  UserArray(){
    let iterator = this.users.values();
    let arr = [];

    for(let i = 0; i < this.users.size; i++){
     arr.push(iterator.next()); 
    }

    return arr;
  }

  Restart(){
    this.currentCard = false;
    this.currentTurn = 0;
    this.started = false;

    this.emit("match restart");

    this.CanStart();
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

      user.cards = [];

      for(let i2 = 0; i2 < playerNumberCards; i2++){
        user.cards.push(this.GetDeckCard());
      }

      user.spectating = false;

      this.ShowCards(user);
    }
  }

  ShowCards(user){
    if(user) user.emit("show cards", this.GetClientCards(user));
  }

  FirstCard(){
    let card = this.GetDeckCard();
    if(card.color >= 4) this.FirstCard();
    else{
      this.currentCard = card;
    }
  }

  StartMatch(){
    this.started = true;
    this.GiveCardsToEveryone();
    this.currentTurn = -1;
    this.roomDeck = getRandomDeck();
    this.roomDeckIndex = 0;
    this.sentido = randomNumber(0, 4);
    this.FirstCard();
    this.PassTurn(true);
  }

  PlayingUsers(){
    let ret = [];
    let arr = this.UserArray();
    for(let i = 0; i < arr.length; i++){
      if(!arr[i]) continue;
      if(!arr[i].value.spectating) ret.push(arr[i]);
    }

    return ret;
  }

  async CheckDraw(){
    if(this.PlayingUsers() <= 1){
      this.emit("match draw");
      await Timeout(5000);
      this.Restart();
      return true;
    }

    return false
  }

  async PassTurn(first){
    await Timeout(2000);

    //draw

    if(await this.CheckDraw()) return;

    let lastPass = false;

    const fnc = async () => {
      this.currentTurn = this.currentTurn + (this.sentido % 2 == 0 ? (1) : (-1));

      if(this.currentTurn >= this.PlayingUsers().length) this.currentTurn = 0;
      if(this.currentTurn < 0) this.currentTurn = this.PlayingUsers().length - 1;
  
      let playerRound = this.PlayingUsers()[this.currentTurn].value;

      if(lastPass == playerRound){
        this.emit("match draw");
        await Timeout(5000);
        this.Restart();
        return;
      }

      if(!playerRound) fnc()
      else {
        lastPass = playerRound;

        if(playerRound.spectating) fnc();
        else{
          playerRound.serverLogic = {
            sayUno: false
          }
          playerRound.emit("round your", this.currentCard.id());
        this.emitExclude(playerRound, "round another", playerRound.data.name, this.currentCard.id());
        if(!first) this.ShowCards(playerRound);
        }
      }
    }

    if(this.currentCard.color == 4 && this.currentCard.number == 4 || this.currentCard.color == 5){
      //comprou carta e troca
      let owner = this.currentCard.owner;

      owner.emit("round choose color");
      this.emitExclude(owner, "round choosing color", owner.data.name);
      return;
    }

    await fnc();
  }

  Draw(socket){
    if(socket){
      let drawed = this.GetDeckCard();
      socket.cards.push(drawed);
      console.log(socket.cards);
      socket.emit("draw", drawed.id());
      return drawed;
    }
    return false;
  }

  Podium(){
    return this.PlayingUsers().sort((a, b) => {
      return (a.value.cards.length - b.value.cards.length);
    });
  }

  async Win(socket){
    if(socket){
      let winners = [];

      let arr = this.Podium();

      for(let i = 0; i < arr.length; i++){
        winners.push({
          name: arr[i].value.data.name,
          cards: arr[i].value.cards.length
        });
      }

      this.emit("match win", winners);
      await Timeout(10000);
      this.Restart();
    }
  }

  NextPlayer(){
    let futureNewTurn = this.currentTurn + 1;
    
      if(futureNewTurn >= this.PlayingUsers().length) futureNewTurn = 0;

    return this.PlayingUsers()[futureNewTurn].value;
  }

  LastPlayer(){
    let futureNewTurn = this.currentTurn - 1;
    
    if(futureNewTurn < 0) futureNewTurn = this.PlayingUsers().length - 1;

  return this.PlayingUsers()[futureNewTurn].value;
  }

  CanStart(){
    if(this.started){

      return;
    }

    if(this.users.size >= minUsersStart){
      let countdown = countdownToStart;
      this.emit("starting", countdown);
      let timer = setInterval(() => {
        countdown--;
        if(countdown <= 10) this.emit("starting", countdown)
        if(countdown == 0) {
          clearInterval(timer);

          this.StartMatch();

        }
      }, 1000)
    }else{
      this.emit("left", minUsersStart - this.users.size);
    }
  }

  GetDeckCard(){
    if(!this.roomDeck) this.roomDeck = getRandomDeck();

    if(this.roomDeckIndex >= this.roomDeck.length) this.roomDeckIndex = 0;

    let card = this.roomDeck[this.roomDeckIndex];

    this.roomDeckIndex++;

    return new Carta(card.color, card.number);
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

  socket.serverLogic = {
    sayUno: false
  }

  socket.on("disconnect", () => {
    currentRoom.DisconnectUser(socket);
  })

  function IsAValidCard(card){
    if(card.length != 2){
        return false;
    }

    let color = card[0];
    let number = card[1];

    if(color != "r" && color != "y" && color != "g" && color != "b" && color != "+" && color != "w") return false;

    if(isNaN(number)) return false;

    return true;
}

function CanPlay(card){
  if(card[0] == "+" || card[0] == "w") return true;

  if(currentRoom.currentCard.color == 4 && card[0] != "+") return false;

  return card[0] == currentRoom.currentCard.id()[0] || card[1] == currentRoom.currentCard.id()[1];
}

  socket.on("choose color", (nextColor) => {
    if(nextColor != "b" && nextColor != "y" && nextColor != "r" && nextColor != "g") return;
    else{
      currentRoom.emit("choosed color", nextColor, name);
      currentRoom.currentCard = ConvertCard(nextColor, 0);
      currentRoom.PassTurn(false);
    }
  })

  socket.on("play", async (card) => {
    if(!card) return;

    if(card == "draw"){

      let drawed = currentRoom.Draw(socket);
      currentRoom.emitExclude(socket, "drawed", name);
      currentRoom.PassTurn(false);
      return;
    }

    function ContainsCardInDeck(player, card){
      let possibleCards = player.cards.filter((a) => {
        return a.number == card.number && a.color == card.color;
      })

      return possibleCards.length > 0;
    }

    function ContainsCardsInDeck(player, card){
      let possibleCards = player.cards.filter((a) => {
        return a.number == card.number || a.color == card.color;
      })

      return possibleCards.length > 0;
    }

    if(card == "challenge"){
      if(currentRoom.currentCard.color != 4){
        socket.emit("cantplay", currentRoom.currentCard.id());
        return;
      }

      let lastPlayer = currentRoom.LastPlayer();

      let lastCard = currentRoom.currentCard.lastCard;

      if(lastCard.color == 4) {
        socket.emit("cantplay", currentRoom.currentCard.id());
        return;
      }

      let toBuy;

      if(ContainsCardsInDeck(lastPlayer, lastCard)){
        currentRoom.emit("challenge win", name, lastPlayer.data);
        toBuy = lastPlayer;
      }else {
        currentRoom.emit("challenge defeat", name, lastPlayer.data);
        toBuy = socket;
      }

      await Timeout(2000);

      for(let i = 0; i < 6; i++){
        currentRoom.Draw(toBuy);
        currentRoom.emitExclude(socket, "drawed", name);
        await Timeout(500);
      }

      currentRoom.currentCard.drawed = true;

      currentRoom.PassTurn(false);

      return;
    }

    if(card == "show"){
      currentRoom.ShowCards(socket);
      socket.emit("showed", currentRoom.currentCard.id());
      return;
    }

    if(card == "uno" && socket.cards.length == 2){
      socket.serverLogic.sayUno = true;
      socket.emit("uno", currentRoom.currentCard.id());
      currentRoom.emitExclude(socket, "p uno", name);
      return;
    }else if(card == "uno"){
      socket.emit("cantplay", currentRoom.currentCard.id(), true);
      return;
    }

    if(!IsAValidCard(card)) return;

    if(!CanPlay(card)) {
      socket.emit("cantplay", currentRoom.currentCard.id());
      return;
    }

    let cardObj = ConvertCard(card[0], card[1]);
    if(!ContainsCardInDeck(socket, cardObj)){
      socket.emit("cantplay", currentRoom.currentCard.id());
      return;
    }

    const ClearCard = () => {
      let cardObj = ConvertCard(card[0], card[1]);

      let jaFoi = false;

      let newCardArray = socket.cards.filter((a) => {
        if(jaFoi) return true;

        if((a.number == cardObj.number && a.color == cardObj.color)) jaFoi = true;

        return !(a.number == cardObj.number && a.color == cardObj.color);
      });
  
      socket.cards = newCardArray;
    }

    if(socket.cards.length == 2 && !socket.serverLogic.sayUno){
      //não disse uno

      if(currentRoom.currentCard.color == 4 && !currentRoom.currentCard.drawed){
        for(let i = 1; i < currentRoom.currentCard.number; i++){
          currentRoom.Draw(socket);
          currentRoom.emitExclude(socket, "drawed", name);
          await Timeout(500);
        }
        currentRoom.currentCard.drawed = true;
        currentRoom.PassTurn(false);
        return;
      }
      
      currentRoom.emitExclude(socket, "p didnt uno", name);
      socket.emit("didnt uno");
      
      await Timeout(2000);

      for(let i = 0; i < 2; i++){
        currentRoom.Draw(socket);
        await Timeout(750);
      }

      currentRoom.PassTurn(false);

      return;
    }


    if(card[0] == "+"){
      let number = parseInt(card[1]);

        let futurePlayer = currentRoom.NextPlayer();

        cardObj.owner = socket;

        ClearCard();

          
        currentRoom.currentCard = cardObj;

        currentRoom.emit("player play draw", name, cardObj.number, futurePlayer.data);

        await Timeout(2000);
        
        for(let i = 1; i <= cardObj.number; i++){
          currentRoom.Draw(futurePlayer);
          currentRoom.emitExclude(futurePlayer, "drawed", name);
          await Timeout(500);
        }

        if(socket.cards.length > 0)     currentRoom.PassTurn(false);
        else {
          currentRoom.Win(socket);
        }
        return;
    }

    ClearCard();
    cardObj.owner = socket;

    currentRoom.currentCard = cardObj;

    currentRoom.emit("player play", name, cardObj.id());

    if(socket.cards.length > 0)     currentRoom.PassTurn(false);
    else {
      currentRoom.Win(socket);
    }
  })
});

httpServer.listen(5000);