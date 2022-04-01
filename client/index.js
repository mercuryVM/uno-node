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

    socket = io.connect("http://10.67.74.64:3000", {query: {
        roomID,
        name
    }});

    Events(socket);
    
}

function LogConsole(str){
    console.log(colors.red("[UNO] ") + str);
}

function FormatCard(card){
    let color = card[0];
    let number = card[1];

    let ret = "NaN";

    ret = color + number + "";

    switch(color){
        case "r": ret = colors.red(ret); break;
        case "y": ret = colors.yellow(ret); break;
        case "b": ret = colors.blue(ret); break;
        case "g": ret = colors.green(ret); break;
    }

    return ret;    
}

function IsAValidCard(card){
    if(card.length != 2){
        return false;
    }

    let color = card[0];
    let number = card[1];

    if(color != "r" && color != "y" && color != "g" && color != "b") return false;

    if(isNaN(number)) return false;

    return true;
}

async function Play(currentCard){
    let play = await Question("Escolha a carta que você vai jogar");

    if(IsAValidCard){
        socket.emit("play", play);
    }else {
        LogConsole("Jogada inválida.");
        Play(currentCard);
    }

}

function Events(socket){
    socket.on("disconnect", () => {LogConsole("Desconectado!");});
    socket.on("join", (userData) => {LogConsole("'" +userData.name + "' entrou na sala!")})
    socket.on("left", (left) => {LogConsole("Faltam " + left + " jogador(es) para iniciar a partida!")})
    socket.on("starting", (countdown) => {LogConsole("Iniciando em " + countdown + " segundo(s)")})
    socket.on("show cards", (data) => {
        const arr = [];
        for(let i = 0; i < data.length; i++){
            arr.push(FormatCard(data[i]));
        }

        LogConsole("Suas cartas são: " + arr);

    });
    socket.on("round your", (currentCard) => {
        LogConsole("É a sua vez de jogar. A carta atual é " + FormatCard(currentCard));

        Play(currentCard);
    });

    socket.on("cantplay", (currentCard) => {LogConsole("Você não pode jogar essa carta!"); Play(currentCard)});
    socket.on("player play", (name, card) => {
        LogConsole(name + " jogou a carta " + FormatCard(card));
    });
    socket.on("draw", (drawedCard) => {
        LogConsole("Você pegou uma carta " + drawedCard);
    })
}

Start();

