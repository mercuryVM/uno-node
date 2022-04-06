const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

var colors = require('colors/safe');

const config = require('./config.json');

const timeout = async (ms) =>{
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    })
}

const getPrefix = () => {
    const d = new Date();
    return colors.gray(d.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1") + " " + colors.red(colors.bold("[UNO do mercúrio ツ] ")));
}

function LogConsole(str){
    console.log(getPrefix() + str);
}

LogConsole("JOGO DE UNO por Gabriel Luís da Silva");

const io = require('socket.io-client');

let socket;

function Question(str, after){
    if(!after) after = "";
    return new Promise(async (resolve) => {
        await timeout(500);
        readline.question(getPrefix() + str + "\n\n" + colors.gray(after), (answer) => resolve(answer));
    })
}

async function Start(){
    const name = await Question("Digite o seu nome de exibição", "Seu nome: ");

    const roomID = await Question("Digite o código da sala", "Código da sala: ");

    LogConsole("Conectando-se a sala " + roomID + "...");

    socket = io.connect(config.ip, {query: {
        roomID,
        name
    }});

    Events(socket);
    
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
        case "+": ret = colors.gray(ret); break;
        case "w": ret = colors.gray(ret); break;
    }

    return ret;    
}

function IsAValidCard(card){
    if(card == "uno" || card == "draw" || card == "show" || card == "challenge") return true;

    if(card.length != 2){
        return false;
    }

    let color = card[0];
    let number = card[1];

    if(color != "r" && color != "y" && color != "g" && color != "b" && color != "+" && color != "w") return false;

    if(isNaN(number)) return false;

    return true;
}

function Commands(cmd){
    switch(cmd){
        case "help":
            LogConsole("Comandos do UNO:");
            LogConsole(colors.red("help") + " - Mostra os comandos do UNO");
            LogConsole(colors.red("show") + " - Mostra as suas cartas atuais");
            LogConsole(colors.red("draw") + " - Compra uma carta");
            LogConsole(colors.red("uno") + " - Use para não levar punição antes de jogar sua penúltima carta");
        return true;
        default: return false;
    }
}

async function Play(currentCard){
    let play = await Question("Escolha a carta que você vai jogar", "Carta para jogar: ");

    if(Commands(play)) {
        Play(play);
        return;
    }

    if(IsAValidCard(play)){
        socket.emit("play", play);
    }else {
        LogConsole("Jogada inválida.");
        Play(currentCard);
    }

}

function Events(socket){
    socket.on("disconnect", () => {LogConsole("Desconectado!");});
    socket.on("join", (userData, started) => {
        if(!started) LogConsole("" + colors.gray(userData.name) + " entrou na sala!")
        else LogConsole("" + colors.gray(userData.name) + " está espectando!")
    });
    socket.on("disconnected", (userData) => {
        LogConsole("" + colors.gray(userData.name) + " saiu da sala!")
    })
    socket.on("showed", (currentCard) => {
        LogConsole(colors.white("Carta atual: ") + FormatCard(currentCard));
        Play(currentCard);
    })
    socket.on("match restart", () => {
        LogConsole("A partida vai recomeçar!")
    });
    socket.on("match draw", () => {
        LogConsole("Empate! Não há vencedores! ");
    })
    socket.on("left", (left) => {LogConsole("Faltam " + left + " jogador(es) para iniciar a partida!")})
    socket.on("starting", (countdown) => {LogConsole("Iniciando em " + countdown + " segundo(s)")})
    socket.on("show cards", (data) => {
        const arr = [];
        for(let i = 0; i < data.length; i++){
            arr.push(FormatCard(data[i]));
        }

        LogConsole("Suas cartas são: " + arr);

    });
    socket.on("player play draw", (who, draw, to) => {
        LogConsole(colors.gray(who) + " jogou uma carta de compra de " + draw + " cartas para " + to.name);
    });
    socket.on("round choosing color", (name) => {
        LogConsole(colors.gray(name) + " está escolhendo a próxima cor...");
    })
    socket.on("round choose color", () => {
        const again = async () => {
            let nextColor = await Question("Escolha uma cor (Azul: b, Amarelo: y, Vermelho: r ou Verde: g)", "Próxima cor: ");
            if(nextColor != "b" && nextColor != "y" && nextColor != "r" && nextColor != "g") return await again();
            else{
                socket.emit("choose color", nextColor);
            }
        }
        again();
    })
    socket.on("match win", (winner) => {
        LogConsole("Temos um vencedor!");
        for(let i = 0; i < winner.length; i++){
            LogConsole((i + 1) + "° - " + winner[i].name + " (" + winner[i].cards + " carta(s))");
        }
    })
    socket.on("choosed color", (color, name) => {
        let col = "";
        switch(color){
            case "b": col = colors.blue("azul"); break;
            case "r": col = colors.red("vermelho"); break;
            case "g": col = colors.green("verde"); break;
            case "y": col = colors.yellow("amarelo"); break;
        }
        LogConsole(colors.gray(name) + " escolheu a cor " + col);
    })
    socket.on("challenge win", (who, challenged) => {
        LogConsole(colors.gray(who) + " desafiou " + colors.gray(challenged) + " e venceu! Agora " + colors.gray(challenged) + " terá que comprar 6 cartas!");
    })
    socket.on("challenge defeat", (who, challenged) => {
        LogConsole(colors.gray(who) + " desafiou " + colors.gray(challenged) + " e perdeu! Agora " + colors.gray(who) + " terá que comprar 6 cartas!");
    })
    socket.on("drawed", (user) => {
        LogConsole(colors.gray(user) + " comprou uma carta.");
    })

    socket.on("round another", (player, currentCard) => {
        LogConsole(colors.white("Agora é a vez de ") + colors.yellow(player));
        LogConsole(colors.white("Carta atual: ") + FormatCard(currentCard));

    });

    socket.on("round your", (currentCard) => {

        LogConsole("É a sua vez de jogar. A carta atual é " + FormatCard(currentCard));
        LogConsole(colors.gray("Caso você não tenha uma carta, digite draw para comprar uma nova carta"));

        Play(currentCard);
    });

    socket.on("cantplay", (currentCard, isUno) => {
        if(isUno){
            LogConsole(colors.red("Você não pode falar uno agora!")); 
        }else {
            LogConsole(colors.red("Você não pode jogar essa carta!")); 
        }
        Play(currentCard);
    });

    socket.on("uno", (currentCard) => {
        LogConsole(colors.rainbow("Você disse UNO!")); 
        Play(currentCard);
    })

    socket.on("p uno", (player) => {
        LogConsole(colors.gray(player) + colors.rainbow(" disse UNO!")); 
    })

    socket.on("p didnt uno", (player) => {
        LogConsole(colors.gray(player) + colors.red(" não disse UNO e portanto foi obrigado a comprar duas cartas!")); 
    })

    socket.on("didnt uno", () => {
        LogConsole(colors.red("Você não disse UNO e portanto foi obrigado a comprar duas cartas!")); 
    })

    socket.on("player play", (name, card) => {
        LogConsole(colors.white(name) + colors.grey(" jogou a carta ") + FormatCard(card));
    });
    socket.on("draw", (drawedCard) => {
        LogConsole(colors.white("Você pegou uma carta ") + FormatCard(drawedCard));
    })
}

Start();

