import http from "http"
import { Server } from "socket.io"
import { Action, createEmptyGame, doAction, filterCardsForPlayerPerspective, Card,distributeInitialCards } from "./model"

const server = http.createServer()
const io = new Server(server)
const port = 8101

let gameState = createEmptyGame(["player1", "player2","player3"], 1, 13)

function emitCardUpdates(cards: Card[], newGame = false, toAll = true) {
  gameState.playerNames.forEach((_, i) => {
    let updatedCardsFromPlayerPerspective = filterCardsForPlayerPerspective(cards, i);
    if (newGame) {
      updatedCardsFromPlayerPerspective = updatedCardsFromPlayerPerspective.filter(card => card.locationType !== "unused");
    }
    if (toAll) {
      io.to(String(i)).emit(newGame ? "all-cards" : "updated-cards", updatedCardsFromPlayerPerspective);
    } else if (i === gameState.currentTurnPlayerIndex) {
      io.to(String(i)).emit(newGame ? "all-cards" : "updated-cards", updatedCardsFromPlayerPerspective);
    }
  });

  if (newGame) {
    gameState.phase = "play";
    emitAllGameState();  
  }
}

let allPlayersConnected = false;
function checkAllPlayersConnected() {
  
  if (gameState.connectedPlayers.size === gameState.playerNames.length) {
    allPlayersConnected = true
    distributeInitialCards(gameState,3);
    emitCardUpdates(Object.values(gameState.cardsById), true, true);
  }
}



function emitAllGameState() {
  io.emit( 
    "game-state", 
    gameState.currentTurnPlayerIndex,
    gameState.phase,
    gameState.playCount
  );
}

io.on('connection', client => {
  function emitGameState() {
    client.emit(
      "game-state", 
      gameState.currentTurnPlayerIndex,
      gameState.phase,
      gameState.playCount
    )
  }
  

  
  
  console.log("New client")
  let playerIndex: number | null | "all" = null
  client.on('player-index', n => {
    playerIndex = n
    console.log("playerIndex set", n)
    console.log(gameState.connectedPlayers)
    console.log(gameState.connectedPlayers.has(n))
    client.join(String(n))
    const alreadyDistributed=gameState.connectedPlayers.has(n)
    if(!(gameState.connectedPlayers.has(n))){
      gameState.connectedPlayers.add(n); 
    }
    if (typeof playerIndex === "number") {
     
      client.emit(
        "all-cards", 
        filterCardsForPlayerPerspective(Object.values(gameState.cardsById), playerIndex).filter(card => card.locationType !== "unused"),
      )
    } else {
      client.emit(
        "all-cards", 
        Object.values(gameState.cardsById),    
      )
    }
    if(!alreadyDistributed||gameState.connectedPlayers.size<gameState.playerNames.length){
      checkAllPlayersConnected()
    }
    emitGameState()

  })



  client.on("action", (action: Action) => {
    if (typeof playerIndex === "number") {
      const updatedCards = doAction(gameState, { ...action, playerIndex })
      emitCardUpdates(updatedCards,false,true)
    } else {
      // no actions allowed from "all"
    }
    io.to("all").emit(
      "updated-cards", 
      Object.values(gameState.cardsById),    
    )
    io.emit(
      "game-state", 
      gameState.currentTurnPlayerIndex,
      gameState.phase,
      gameState.playCount
    )
  })

  client.on("new-game", () => {
    gameState = createEmptyGame(gameState.playerNames, 1, 13)
    const updatedCards = Object.values(gameState.cardsById)
    emitCardUpdates(updatedCards,true,true)
    io.to("all").emit(
      "all-cards", 
      updatedCards,
    )
    io.emit(
      "game-state", 
      gameState.currentTurnPlayerIndex,
      gameState.phase,
      gameState.playCount
    )
  })
})
server.listen(port)
console.log(`Game server listening on port ${port}`)
