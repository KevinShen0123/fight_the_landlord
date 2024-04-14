import http from "http"
import { Server } from "socket.io"
import { Action, createEmptyGame, doAction, filterCardsForPlayerPerspective, Card,getLastPlayedCard,distributeInitialCards } from "./model"

const server = http.createServer()
const io = new Server(server)
const port = 8101

let gameState = createEmptyGame(["player1", "player2"], 1, 13)

function emitUpdatedCardsForPlayers(cards: Card[], newGame = false) {
  gameState.playerNames.forEach((_, i) => {
    let updatedCardsFromPlayerPerspective = filterCardsForPlayerPerspective(cards, i)
    if (newGame) {
      updatedCardsFromPlayerPerspective = updatedCardsFromPlayerPerspective.filter(card => card.locationType !== "unused")
    }
    console.log("emitting update for player", i, ":", updatedCardsFromPlayerPerspective)
    io.to(String(i)).emit(
      newGame ? "all-cards" : "updated-cards", 
      updatedCardsFromPlayerPerspective,
    )
  })
}

let allPlayersConnected = false;
function checkAllPlayersConnected() {
  
  if (gameState.connectedPlayers.size === gameState.playerNames.length) {
    allPlayersConnected = true
    distributeInitialCards(gameState,3);
    emitUpdatedCardsForAllPlayers(true);
  }
}

function emitUpdatedCardsForAllPlayers(newGame = false) {
  gameState.playerNames.forEach((_, i) => {
    let updatedCardsFromPlayerPerspective = filterCardsForPlayerPerspective(Object.values(gameState.cardsById), i);
    if (newGame) {
      updatedCardsFromPlayerPerspective = updatedCardsFromPlayerPerspective.filter(card => card.locationType !== "unused");
    }
    io.to(String(i)).emit(newGame ? "all-cards" : "updated-cards", updatedCardsFromPlayerPerspective);
  });

  gameState.phase = "play";
  emitAllGameState(); 

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
    client.join(String(n))
    gameState.connectedPlayers.add(n); 
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
    checkAllPlayersConnected()
    emitGameState()

  })



  client.on("action", (action: Action) => {
    if (typeof playerIndex === "number") {
      const updatedCards = doAction(gameState, { ...action, playerIndex })
      emitUpdatedCardsForPlayers(updatedCards)
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
    gameState = createEmptyGame(gameState.playerNames, 2, 2)
    const updatedCards = Object.values(gameState.cardsById)
    emitUpdatedCardsForPlayers(updatedCards, true)
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
