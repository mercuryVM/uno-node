console.log("JOGO DE UNO por Gabriel Luís da Silva");

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

var colors = require('colors/safe');

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

function LogConsole(str){
    console.log(colors.red("[UNO] ") + str);
}

function Events(socket){
    socket.on("disconnect", () => {LogConsole("Desconectado!");});
    socket.on("join", (userData) => {LogConsole("'" +userData.name + "' entrou na sala!")})
    socket.on("left", (left) => {LogConsole("Faltam " + left + " jogador(es) para iniciar a partida!")})
    socket.on("starting", (countdown) => {LogConsole("Iniciando em " + countdown + " segundo(s)")})
    socket.on("show cards", (data) => {LogConsole(data.length)})
}

Start();

