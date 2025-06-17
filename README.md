
# 🃏 uno-node — Jogo de UNO no Terminal (Socket.IO)

**uno-node** é um jogo multiplayer de UNO rodando no **terminal**, desenvolvido em **Node.js** com **Socket.IO**. Os jogadores se conectam a salas via código e jogam em tempo real com atualizações no console, com suporte a cartas especiais, comando `uno`, desafios, e muito mais — tudo com feedback colorido no estilo 👾.

---

## 🧠 Funcionalidades

- 🔸 Multiplayer com salas via Socket.IO
- 🔸 Interface em modo texto (console)
- 🔸 Suporte a cartas +2, reverso, pular, coringa e coringa +4
- 🔸 Sistema de desafios com punições
- 🔸 Comando `uno` obrigatório
- 🔸 Feedback visual com `colors.js`

---

## 🛠️ Requisitos

- Node.js 16+
- Terminal compatível com cores (recomendado: terminal moderno como o Windows Terminal, iTerm, etc.)

---

## 🚀 Como rodar

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/uno-node.git
cd uno-node

2. Instale as dependências

npm install

3. Configure o endereço do servidor

Edite o arquivo config.json com o IP do servidor:

{
  "ip": "http://localhost:3000"
}

> Obs: você pode usar IPs de rede local para jogar com amigos no mesmo Wi-Fi.




---

4. Inicie o servidor

node server.js

(Certifique-se que ele está escutando e pronto para aceitar conexões)


---

5. Inicie um cliente (em outro terminal)

node client.js

Digite seu nome

Digite o código da sala (pode ser qualquer string)

Aguarde outros jogadores

A partida começará automaticamente quando houver jogadores suficientes



---

🎮 Comandos disponíveis (durante o jogo)

Comando	Função

help	Mostra todos os comandos disponíveis
show	Mostra suas cartas atuais
draw	Compra uma carta
uno	Declara "UNO!" antes da penúltima carta
play <carta>	Joga uma carta (ex: play r4 para vermelho 4)


Códigos de cor:

r: vermelho

g: verde

b: azul

y: amarelo

w: coringa

+: coringa +4



---

🌐 Estrutura de pastas (exemplo)

uno-node/
├── client.js         # Cliente terminal
├── server.js         # Servidor Socket.IO
├── config.json       # IP do servidor
├── package.json
└── ...


---

🧪 Exemplos de cartas no terminal

r4 → 🔴 4

b+2 → 🔵 +2

w+4 → 🎲 +4 coringa



---

✨ Créditos

Desenvolvido por Gabriel Luís da Silva (Mercúrio ツ) como experimento de jogo em tempo real via terminal, com Node.js + Socket.IO.


---

📄 Licença

Este projeto está sob a licença MIT.