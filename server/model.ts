////////////////////////////////////////////////////////////////////////////////////////////
// data model for cards and game state

export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
export const SUITS = ["♦️", "♥️", "♣️", "♠️"]

export type CardId = string
export type LocationType = "unused" | "last-card-played" | "player-hand"

export interface Card {
  id: CardId
  rank: typeof RANKS[number]
  suit: typeof SUITS[number]
  locationType: LocationType
  playerIndex: number | null
  positionInLocation: number | null
}

/**
 * determines whether one can play a card given the last card played
 */
export function areCompatible(card: Card, lastCardPlayed: Card) {
  return card.rank === lastCardPlayed.rank || card.suit === lastCardPlayed.suit
}

export type GamePhase = "initial-card-dealing" | "play" | "game-over"

export interface GameState {
  playerNames: string[]
  cardsById: Record<CardId, Card>
  currentTurnPlayerIndex: number
  phase: GamePhase
  playCount: number
  connectedPlayers: Set<number> 
  lastPlayedCards:Card[]
}

/**
 * @returns an array of the number of the cards in each player's hand
 */
export function computePlayerCardCounts({ playerNames, cardsById }: GameState) {
  const counts = playerNames.map(_ => 0)
  Object.values(cardsById).forEach(({ playerIndex }) => {
    if (playerIndex != null) {
      ++counts[playerIndex]
    }
  })
  return counts
}

/**
 * finds the last played card
 */
export function getLastPlayedCard(cardsById: Record<CardId, Card>) {
  return Object.values(cardsById).find(c => c.locationType === "last-card-played") || null
}
/**
 * finds the last played card
 */
export function getLastPlayedCardS(cardsById: Record<CardId, Card>) {
  return Object.values(cardsById).filter(c => c.locationType === "last-card-played") || null
}

/**
 * extracts the cards that are currently in the given player's hand
 */
 export function extractPlayerCards(cardsById: Record<CardId, Card>, playerIndex: number): Card[] {
  return Object.values(cardsById).filter(({ playerIndex: x }) => x === playerIndex)
}

/**
 * determines if someone has won the game -- i.e., has no cards left in their hand
 */
 export function determineWinner(state: GameState) {
  if (state.phase === "initial-card-dealing") {
    return null
  }
  const playerIndex = computePlayerCardCounts(state).indexOf(0)
  return playerIndex === -1 ? null : playerIndex
}


export function distributeInitialCards(state: GameState, cardsPerPlayer: number) {


  

  if (state.connectedPlayers.size !== state.playerNames.length) {
    console.log("Not all players have connected yet. Cannot distribute cards.");
    return;
  }


  for (let i = 0; i < state.playerNames.length; i++) {
    for (let j = 0; j < cardsPerPlayer; j++) {
      const cardId = findNextCardToDraw(state.cardsById);
      if (cardId != null) {
        const card = state.cardsById[cardId];
        
        moveCardToPlayer(state, card);
      }
      
    }
    moveToNextPlayer(state)
  }

  
  const cardId = findNextCardToDraw(state.cardsById)
  if (cardId != null) {
    const card = state.cardsById[cardId]
    // moveCardToLastPlayed(state, card)
  }



  console.log("Distribute completed")


  
}


/**
 * creates an empty GameState in the initial-card-dealing state
 */
 export function createEmptyGame(playerNames: string[], numberOfDecks = 5, rankLimit = Infinity): GameState {
  const cardsById: Record<CardId, Card> = {}
  let cardId = 0

  for (let i = 0; i < numberOfDecks; i++) {
    for (const suit of SUITS) {
      for (const rank of RANKS.slice(0, rankLimit)) {
        const card: Card = {
          suit,
          rank,
          id: String(cardId++),
          locationType: "unused",
          playerIndex: null,
          positionInLocation: null,
          
        }
        cardsById[card.id] = card
      }
    }
  }

  


  return {
    playerNames,
    cardsById,
    currentTurnPlayerIndex: 0,
    phase: "initial-card-dealing",
    playCount: 0,
    connectedPlayers: new Set(), 
    lastPlayedCards:[]
  }
}

/**
 * looks through the cards for a random card in the unused state -- 
 * basically, equivalent to continuously shuffling the deck of discarded cards
 */
export function findNextCardToDraw(cardsById: Record<CardId, Card>): CardId | null {
  const unplayedCardIds = Object.keys(cardsById).filter(cardId => cardsById[cardId].locationType === "unused")
  if (unplayedCardIds.length === 0) {
    return null
  }
  return unplayedCardIds[Math.floor(Math.random() * unplayedCardIds.length)]
}

////////////////////////////////////////////////////////////////////////////////////////////
// player actions

export interface DrawCardAction {
  action: "draw-card"
  playerIndex: number
}

export interface PlayCardAction {
  action: "play-card"
  playerIndex: number
  cardId: CardId
}

export interface PlayCardsAction {
  action: "play-cards"
  playerIndex: number
  cardIds: CardId[];
}
export interface PassAction{
  action:"Pass"
  playerIndex:number
}

export type Action = DrawCardAction | PlayCardAction | PlayCardsAction| PassAction

function moveToNextPlayer(state: GameState) {
  state.currentTurnPlayerIndex = (state.currentTurnPlayerIndex + 1) % state.playerNames.length
}

function moveCardToPlayer({ currentTurnPlayerIndex, cardsById }: GameState, card: Card) {
  // add to end position
  const currentCardPositions = extractPlayerCards(cardsById, currentTurnPlayerIndex).map(x => x.positionInLocation)

  // update state
  card.locationType = "player-hand"
  card.playerIndex = currentTurnPlayerIndex
  card.positionInLocation = Math.max(-1, ...currentCardPositions) + 1
}

function moveCardToLastPlayed({ currentTurnPlayerIndex, cardsById }: GameState, card: Card) {
  // change current last-card-played to unused
  Object.values(cardsById).forEach(c => {
    if (c.locationType === "last-card-played") {
  
      if(c.playerIndex!==card.playerIndex){
        c.locationType="unused"
      }
    }
  })

  // update state
  card.locationType = "last-card-played"
  card.positionInLocation = null
}
function compareSingleCard(realcardtoplay:Card,reallastplayedcard:Card){
  var canPlay=false
  if(realcardtoplay.rank==="3"&&reallastplayedcard.rank==="3"){
    canPlay=true
    return canPlay
   }
   if(realcardtoplay.rank==="A"&&reallastplayedcard.rank==="A"){
    canPlay=true
    return canPlay
   }

  if(realcardtoplay.playerIndex===reallastplayedcard.playerIndex){
    canPlay=true
    return canPlay
  }
 
      if(realcardtoplay.rank==="3"&&reallastplayedcard.rank!=="3"){
         canPlay=true
      }else if(realcardtoplay.rank==="2"&&reallastplayedcard.rank!=="2"&&reallastplayedcard.rank!="3"){
        canPlay=true
      }else if(realcardtoplay.rank==="A"){
        canPlay=false
      }else if(reallastplayedcard.rank==="3"&&realcardtoplay.rank!=="3"){
        canPlay=false
      }else if(reallastplayedcard.rank==="2"&&realcardtoplay.rank!=="3"&&realcardtoplay.rank!=="2"){
        canPlay=false
      }else if(realcardtoplay.rank==="K"&&(reallastplayedcard.rank==="Q"||reallastplayedcard.rank==="J")){
        canPlay=true
      }else if(realcardtoplay.rank==="Q"&&reallastplayedcard.rank==="J"){
        canPlay=true
      }else if(Number.isNaN(Number(realcardtoplay.rank))&&Number.isNaN(Number(reallastplayedcard.rank))&&reallastplayedcard.rank!="A"){
        canPlay=false
      }else if(Number.isNaN(Number(realcardtoplay.rank))&&!(Number.isNaN(Number(reallastplayedcard.rank)))){
        canPlay=true
      }else if(Number(realcardtoplay.rank)>Number(reallastplayedcard.rank)){
        canPlay=true
      }else if(reallastplayedcard.rank==="A"){
        canPlay=true
      }
      return canPlay
}
/**
 * updates the game state based on the given action
 * @returns an array of cards that were updated, or an empty array if the action is disallowed
 */
export function doAction(state: GameState, action: Action): Card[] {
  const changedCards: Card[] = []
  if (state.phase === "game-over") {
    // game over already
    return []
  }
  if (action.playerIndex !== state.currentTurnPlayerIndex) {
    // not your turn
    return []
  }

  if (action.action === "draw-card") {
    const cardId = findNextCardToDraw(state.cardsById)
    if (cardId == null) {
      return []
    }
    const card = state.cardsById[cardId]
    moveCardToPlayer(state, card)
    changedCards.push(card)
  }


  if (action.action === "play-card") {
    const card = state.cardsById[action.cardId]
    if (card.playerIndex !== state.currentTurnPlayerIndex) {
      // not your card
      return []
    }

    const lastPlayedCard = getLastPlayedCard(state.cardsById)
    if (lastPlayedCard == null) {
      return []
    }
    if (!areCompatible(lastPlayedCard, card)) {
      return []
    }
    changedCards.push(lastPlayedCard)
    moveCardToLastPlayed(state, card)
    changedCards.push(card)
  }
  if(action.action ==="Pass"&&state.phase=="play"){
   moveToNextPlayer(state)
   return []
  }

  if (action.action === "play-cards") {
    const cardsToPlay = action.cardIds.map(cardId => state.cardsById[cardId]);
    console.log(cardsToPlay)
  
    if (!cardsToPlay.every(card => card.playerIndex === state.currentTurnPlayerIndex)) {
      return [];  
    }
  
 
    var  lastPlayedCard = getLastPlayedCardS(state.cardsById);
    if(cardsToPlay.length!=lastPlayedCard.length&&lastPlayedCard.length>0){
      console.log("length not equal!!!!!!!!!!")
      var indexallsame=true
      for(var x=0;x<cardsToPlay.length;x++){
        for(var h=0;h<lastPlayedCard.length;h++){
          if(lastPlayedCard[h].playerIndex!==cardsToPlay[x].playerIndex){
         
            indexallsame=false
            break
          }
        }
      }
      
      if(!indexallsame){
      return [];
      }
    }

    var incompatiblecount=0
    
    if(cardsToPlay.length===lastPlayedCard.length&&lastPlayedCard.length==1){
     
      var reallastplayedcard=lastPlayedCard[0]
      var realcardtoplay=cardsToPlay[0]
      var canPlay=compareSingleCard(realcardtoplay,reallastplayedcard)
      if(!canPlay){
        return []
      }
    
    cardsToPlay.forEach(card => {
      moveCardToLastPlayed(state, card);
      changedCards.push(card);
    });
    if(cardsToPlay[0].playerIndex===lastPlayedCard[0].playerIndex){
      lastPlayedCard[0].locationType="unused"
    }
    lastPlayedCard=getLastPlayedCardS(state.cardsById)
    lastPlayedCard.forEach(lcard=>{
      var idequalcount=0
      state.lastPlayedCards.forEach(lastcards=>{
        if(lastcards.id==lcard.id){
          idequalcount+=1;
        }
      })
      if(idequalcount==0){
        state.lastPlayedCards.push(lcard)
      }
    })
    }else if(cardsToPlay.length===lastPlayedCard.length&&lastPlayedCard.length>1){
      var allsame=true
      for(var i=0;i<cardsToPlay.length;i++){
        if(i>0){
          if(cardsToPlay[i].rank!==cardsToPlay[i-1].rank){
            allsame=false
            break
          }
          if(lastPlayedCard[i].rank!==lastPlayedCard[i-1].rank){
            allsame=false
            break
          }
        }
      }
      if(allsame){
        var canPlay=compareSingleCard(cardsToPlay[0],lastPlayedCard[0])
        if(!canPlay){
          return []
        }
        cardsToPlay.forEach(card => {
          moveCardToLastPlayed(state, card);
          changedCards.push(card);
        });
        var indexallsame=true
        for(var m=0;m<cardsToPlay.length;m++){
          if(cardsToPlay[m].playerIndex!==lastPlayedCard[m].playerIndex){
            indexallsame=false
            break
          }
        }
     
        if(indexallsame){
          for(var n=0;n<lastPlayedCard.length;n++){
              lastPlayedCard[n].locationType="unused"
          }
        }
   
        lastPlayedCard=getLastPlayedCardS(state.cardsById)
        lastPlayedCard.forEach(lcard=>{
          var idequalcount=0
          state.lastPlayedCards.forEach(lastcards=>{
            if(lastcards.id==lcard.id){
              idequalcount+=1;
            }
          })
          if(idequalcount==0){
            state.lastPlayedCards.push(lcard)
          }
        })
      }else{
        var equaldif=true
        for(var i=0;i<cardsToPlay.length;i++){
          if(i>0){
            if(cardsToPlay[i].rank==="K"&&cardsToPlay[i-1].rank==="Q"){
              equaldif=true
            }else if(cardsToPlay[i].rank==="Q"&&cardsToPlay[i-1].rank==="J"){
              equaldif=true
            }else if(cardsToPlay[i].rank==="2"&&cardsToPlay[i-1].rank==="A"){
              equaldif=true
            }else if(cardsToPlay[i].rank==="J"&&cardsToPlay[i-1].rank==="Q"){
              equaldif=true
            }else if(cardsToPlay[i].rank==="A"&&cardsToPlay[i-1].rank==="2"){
              equaldif=true
            }else if(cardsToPlay[i].rank==="Q"&&cardsToPlay[i-1].rank==="K"){
              equaldif=true
            }else if(cardsToPlay[i].rank==="J"&&cardsToPlay[i-1].rank==="10"){
              equaldif=true
            }else if(Math.abs(Number(cardsToPlay[i].rank)-Number(cardsToPlay[i-1].rank))===1){
              equaldif=true
            }else{
              equaldif=false
              break
            }
          }
        }
        if(equaldif===false){
          return []
        }
        for(var j=0;j<lastPlayedCard.length;j++){
          if(j>0){
            if(lastPlayedCard[j].rank==="K"&&lastPlayedCard[j-1].rank==="Q"){
              equaldif=true
            }else if(lastPlayedCard[j].rank==="Q"&&lastPlayedCard[j-1].rank==="J"){
              equaldif=true
            }else if(lastPlayedCard[j].rank==="2"&&lastPlayedCard[j-1].rank==="A"){
              equaldif=true
            }else if(lastPlayedCard[j].rank==="J"&&lastPlayedCard[j-1].rank==="Q"){
              equaldif=true
            }else if(lastPlayedCard[j].rank==="A"&&lastPlayedCard[j-1].rank==="2"){
              equaldif=true
            }else if(lastPlayedCard[j].rank==="Q"&&lastPlayedCard[j-1].rank==="K"){
              equaldif=true
            }else if(lastPlayedCard[j].rank==="J"&&lastPlayedCard[j-1].rank==="10"){
              equaldif=true
            }else if(Math.abs(Number(lastPlayedCard[j].rank)-Number(lastPlayedCard[j-1].rank))===1){
              equaldif=true
            }else{
              equaldif=false
              break
            }
          }
        }
        
        if(equaldif===false){
          return []
        }
        for(var a=0;a<cardsToPlay.length;a++){
          var firstCt=0
          for(var b=0;b<cardsToPlay.length;b++){
            if(a!=b){
              var compat=compareSingleCard(cardsToPlay[a],cardsToPlay[b])
              if(!compat){
                firstCt+=1;
              }
            }
          }
          var secondCt=0;
          for(var c=0;c<lastPlayedCard.length;c++){
            var compat=compareSingleCard(cardsToPlay[a],lastPlayedCard[c])
            if(cardsToPlay[a].rank===lastPlayedCard[c].rank){
              compat=true
            }
            if(!compat){
              secondCt+=1;
            }
          }
         
          if(firstCt<=secondCt-1){
            return []
          }
        }
        cardsToPlay.forEach(card => {
          moveCardToLastPlayed(state, card);
          changedCards.push(card);
        });
        var indexallsame=true
        for(var m=0;m<cardsToPlay.length;m++){
          for(var n=0;n<lastPlayedCard.length;n++){
            if(cardsToPlay[m].playerIndex!==lastPlayedCard[n].playerIndex){
              indexallsame=false
              break
            }
          }
        }

        if(indexallsame){
          for(var n=0;n<lastPlayedCard.length;n++){
              lastPlayedCard[n].locationType="unused"
          }
        }
        lastPlayedCard=getLastPlayedCardS(state.cardsById)
        lastPlayedCard.forEach(lcard=>{
          var idequalcount=0
          state.lastPlayedCards.forEach(lastcards=>{
            if(lastcards.id==lcard.id){
              idequalcount+=1;
            }
          })
          if(idequalcount==0){
            state.lastPlayedCards.push(lcard)
          }
        })
      }
    }else{
 
      cardsToPlay.forEach(card => {
        moveCardToLastPlayed(state, card);
        changedCards.push(card);
      });
      var indexallsame=true
      for(var m=0;m<cardsToPlay.length;m++){
        for(var n=0;n<lastPlayedCard.length;n++){
          if(cardsToPlay[m].playerIndex!==lastPlayedCard[n].playerIndex){
            indexallsame=false
            break
          }
        }
      }

      if(indexallsame){
        for(var n=0;n<lastPlayedCard.length;n++){
            lastPlayedCard[n].locationType="unused"
        }
      }
      lastPlayedCard=getLastPlayedCardS(state.cardsById)
      lastPlayedCard.forEach(lcard=>{
        var idequalcount=0
        state.lastPlayedCards.forEach(lastcards=>{
          if(lastcards.id==lcard.id){
            idequalcount+=1;
          }
        })
        if(idequalcount==0){
          state.lastPlayedCards.push(lcard)
        }
      })
    }
  }
  

  if (state.phase === "play" && action.action !== "draw-card") {
    moveToNextPlayer(state)
  }

  if (determineWinner(state) != null) {
    state.phase = "game-over"
  }

  ++state.playCount

  return changedCards
}

export function formatCard(card: Card, includeLocation = false) {
  let paddedCardId = card.id
  while (paddedCardId.length < 3) {
    paddedCardId = " " + paddedCardId
  }
  return `[${paddedCardId}] ${card.rank}${card.suit}${(card.rank.length === 1 ? " " : "")}`
    + (includeLocation
      ? ` ${card.locationType} ${card.playerIndex ?? ""}`
      : ""
    )
}

export function printState({ playerNames, cardsById, currentTurnPlayerIndex, phase, playCount }: GameState) {
  const lastPlayedCard = getLastPlayedCard(cardsById)
  console.log(`#${playCount} ${phase} ${lastPlayedCard ? formatCard(lastPlayedCard) : ""}`)
  playerNames.forEach((name, playerIndex) => {
    const cards = extractPlayerCards(cardsById, playerIndex)
    console.log(`${name}: ${cards.map(card => formatCard(card)).join(' ')} ${playerIndex === currentTurnPlayerIndex ? ' *TURN*' : ''}`)
  })
}

/**
 * @returns only those cards that the given player has any "business" seeing
 */
export function filterCardsForPlayerPerspective(cards: Card[], playerIndex: number) {
  return cards.filter(card => card.playerIndex == null || card.playerIndex === playerIndex)
}