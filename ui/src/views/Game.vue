<template>
  <div>
    <b-button class="mx-2 my-2" size="sm" @click="socket.emit('new-game')">New Game</b-button>
    <b-badge class="mr-2 mb-2" :variant="myTurn ? 'primary' : 'secondary'">turn: {{ currentTurnPlayerIndex }}</b-badge>
    <b-badge class="mr-2 mb-2">{{ phase }}</b-badge>
    
    <div class = "container">
      <div class="unused-cards">
        <h1>Unused Card</h1>
          <AnimatedCard
          v-for="card in unusedCards"
          :key="card.id"
          :card="card"
          :includeLocation="true"
          :lastPlayedCard="lastPlayedCard"
          @cardClick="playCard(card.id)"
        />
        
      </div>


      <div class="card-pile">
      <h1>Card Pile</h1>
      <div class="cards-container">
        <AnimatedCard
            v-for="card in lastPlayedCards"
            :class="card.id"
            :key="card.id"
            :card="card"
            :includeLocation="true"
            :lastPlayedCard="lastPlayedCard"
            @cardClick="playCard(card.id)"
          />
      </div>
      </div>



 
      <div class="bottom-container">
        <div class="your-cards">
          <h1>Your Card</h1>
          <div class="cards-container">
          <AnimatedCard
            v-for="card in playerHandCards"
            :key="card.id"
            :card="card"
            :includeLocation="true"
            :lastPlayedCard="lastPlayedCard"
            @cardClick="setcanplayCard(card.id)"
          />
          </div>
          <button @click="playcards(cardIds)" :disabled="!canPlayCard">Play Cards</button>
        </div>
      </div>

   
    
    
    </div>
    
    <b-button class="mx-2 my-2" size="sm" @click="drawCard" :disabled="!myTurn">Draw Card</b-button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, Ref } from 'vue'
import { io } from "socket.io-client"
import { Card, GamePhase, Action, formatCard, CardId } from "../../../server/model"
import AnimatedCard from "./AnimatedCard.vue"
const canPlayCard:Ref<Boolean>=ref(false)
const cardIds:Ref<CardId[]>=ref([])
// props
interface Props {
  playerIndex?: string
}

// default values for props
const props = withDefaults(defineProps<Props>(), {
  playerIndex: "all",
})



//new
const lastPlayedCard = computed(() => {
  const result = cards.value.filter(card => card.locationType === 'last-card-played');
  return result.length > 0 ? result[0] : null;
});

const lastPlayedCards = computed(() => {
  const result = cards.value.filter(card => card.locationType === 'last-card-played');
  return result.length > 0 ? result : null;
});



const playerHandCards = computed(() => {
  const result =  cards.value.filter(card => card.locationType === 'player-hand');
  return result.length > 0 ? result : null;
});

const unusedCards = computed(() => {
  const result =  cards.value.filter(card => card.locationType === 'unused');
  return result.length > 0 ? result : null;
});



const socket = io()
let x = props.playerIndex
let playerIndex: number | "all" = parseInt(x) >= 0 ? parseInt(x) : "all"
console.log("playerIndex", JSON.stringify(playerIndex))
socket.emit("player-index", playerIndex)

const cards: Ref<Card[]> = ref([])
const currentTurnPlayerIndex = ref(-1)
const phase = ref("")
const playCount = ref(-1)

const myTurn = computed(() => currentTurnPlayerIndex.value === playerIndex && phase.value !== "game-over")




socket.on("all-cards", (allCards: Card[]) => {
  cards.value = allCards
})

socket.on("updated-cards", (updatedCards: Card[]) => {
  applyUpdatedCards(updatedCards)
})

socket.on("game-state", (newCurrentTurnPlayerIndex: number, newPhase: GamePhase, newPlayCount: number) => {
  currentTurnPlayerIndex.value = newCurrentTurnPlayerIndex
  phase.value = newPhase
  playCount.value = newPlayCount
})

function doAction(action: Action) {
  return new Promise<Card[]>((resolve, reject) => {
    socket.emit("action", action)
    socket.once("updated-cards", (updatedCards: Card[]) => {
      resolve(updatedCards)
    })
  })
}

async function drawCard() {
  if (typeof playerIndex === "number") {
    const updatedCards = await doAction({ action: "draw-card", playerIndex })
    if (updatedCards.length === 0) {
      alert("didn't work")
    }
  }
}

async function playCard(cardId: CardId) {
  if (typeof playerIndex === "number") {
    const updatedCards = await doAction({ action: "play-card", playerIndex, cardId })
    if (updatedCards.length === 0) {
      alert("didn't work")
    }
  }
}
async function playcards(cardIds:CardId[]){
  alert("playcards length:"+String(cardIds.length))
  for(const cardid of cardIds){
    playCard(cardid)
    alert("called Play card"+String(cardid))
  }
  canPlayCard.value=false
}
async function setcanplayCard(thiscardId:String){
  cardIds.value.push(String(thiscardId))
  canPlayCard.value=true
  alert("one card clocked"+String(cardIds.value.length))
}

async function applyUpdatedCards(updatedCards: Card[]) {
  for (const x of updatedCards) {
    const existingCard = cards.value.find(y => x.id === y.id)
    if (existingCard) {
      Object.assign(existingCard, x)
    } else {
      cards.value.push(x)
    }
  }
}
</script>

<style>
.container {
  display: flex;
  flex-direction: column;
  height: 85vh; 
  justify-content: space-between; 
  padding: 10px 0; 
}

.title {
  margin-bottom: 20px; 
  text-align: center; 
}
.cards-container {
  display: flex;
  flex-direction: row;
  gap: 10px;
  justify-content: center;
  margin-top: 20px; 
}

.unused-cards {
  display: flex;
  flex-wrap: wrap; 
  justify-content: flex-start;
  align-items: flex-start;
  position: absolute;
  top: 10px;
  right: 10px;
  max-width: calc(4 * 100px);
  margin-bottom: 20px; /* Added margin to the bottom of this class */
}

.unused-cards h1 {
  width: 100%; /* Make sure the title spans the full width */
  margin-bottom: 10px; /* This is the actual margin that creates space between the title and the cards */
}

.bottom-container .cards-container {
  margin-top: 10px; 
}


.card-pile .cards-container {
  margin-top: 10px; 
}
</style>

