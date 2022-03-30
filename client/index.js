console.log("JOGO DE UNO por Gabriel Luís da Silva");

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

const io = require('socket.io-client');

let socket;

function Question(str){
    return new Promise((resolve) => {
        readline.question(str, (answer) => resolve(answer));
    })
}

async function Start(){
    const name = await Question("Digite o seu nome de exibição");

    const roomID = await Question("Digite o código da sala");

    console.log("Conectando-se a sala " + roomID + "...");

    socket = io.connect("http://localhost:3000", {query: {
        roomID,
        name
    }});

    Events(socket);
    
}

function Events(socket){
    socket.on("disconnect", () => {console.log("Desconectado!");});
    socket.on("join", (userData) => {console.log(userData.name + " entrou na sala!")})
    socket.on("left", (left) => {console.log("Faltam " + left + " jogador(es) para iniciar a partida!")})
    socket.on("starting", (countdown) => {console.log("Iniciando em " + countdown + " segundo(s)")})
}

Start();

