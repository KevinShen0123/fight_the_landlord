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
        />
        
      </div>


      <div class="card-pile">
      <h1>Card Pile</h1>
      <div class="cards-container">
        <AnimatedCard
            v-for="card in lplaycards"
            :key="card.id"
            :card="card"
            :includeLocation="true"
            :lastPlayedCard="lastPlayedCard"
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
            :selected="selectedCardIds.includes(card.id)" 
            @cardClick="toggleCardSelection(card.id)"
          />
          </div>
        </div>
      </div>

 
      

   
      <b-button class="mx-2 my-2" size="sm" @click="playSelectedCards" :disabled="!myTurn || selectedCardIds.length === 0">Play Selected Cards</b-button>  <!-- 新增按钮 -->
      <b-button :disabled="!myTurn" @click="pass">Pass</b-button>
    </div>
    
    <b-button class="mx-2 my-2" size="sm" @click="drawCard" :disabled="!myTurn">Draw Card</b-button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, Ref } from 'vue'
import { io } from "socket.io-client"
import { Card, GamePhase, Action, formatCard, CardId } from "../../../server/model"
import AnimatedCard from "./AnimatedCard.vue"
// props
interface Props {
  playerIndex?: string
}

// default values for props
const props = withDefaults(defineProps<Props>(), {
  playerIndex: "all",
})

const selectedCardIds = ref<CardId[]>([]);

//new
const lastPlayedCard = computed(() => {
  const result = cards.value.filter(card => card.locationType === 'last-card-played');
  return result.length > 0 ? result[0] : null;
});



const playerHandCards = computed(() => {
  const result =  cards.value.filter(card => card.locationType === 'player-hand');
  return result.length > 0 ? result : null;
});

const unusedCards = computed(() => {
  const result =  lastPlayedCards.value.filter(card => card.locationType === 'unused');
  return result.length > 0 ? result : null;
});
const lplaycards= computed(() => {
  const result =  lastPlayedCards.value.filter(card => card.locationType === 'last-card-played');
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
const lastPlayedCards:Ref<Card[]>=ref([])
const myTurn = computed(() => currentTurnPlayerIndex.value === playerIndex && phase.value !== "game-over")




socket.on("all-cards", (allCards: Card[]) => {
  cards.value = allCards
})

socket.on("updated-cards", (updatedCards: Card[]) => {
  applyUpdatedCards(updatedCards)
})

socket.on("game-state", (newCurrentTurnPlayerIndex: number, newPhase: GamePhase, newPlayCount: number,lastPlayedCardsArr:Card[]) => {
  currentTurnPlayerIndex.value = newCurrentTurnPlayerIndex
  phase.value = newPhase
  playCount.value = newPlayCount
  lastPlayedCards.value=lastPlayedCardsArr
})

function doAction(action: Action) {
  return new Promise<Card[]>((resolve, reject) => {
    socket.emit("action", action)
    if(action.action!=="Pass"){
      socket.once("updated-cards", (updatedCards: Card[]) => {
      resolve(updatedCards)
    })
    }
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
async function pass(){
  if(typeof playerIndex==="number"){
     await doAction({ action: "Pass", playerIndex})
  }
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



function toggleCardSelection(cardId: CardId) {
 
  const index = selectedCardIds.value.indexOf(cardId);
  if (index > -1) {
    selectedCardIds.value.splice(index, 1);
  } else {
    selectedCardIds.value.push(cardId);
  }

  
}

async function playSelectedCards() {
  if (selectedCardIds.value.length > 0 && typeof playerIndex === "number") {
    const updatedCards = await doAction({
      action: "play-cards",  // 注意这里的后端接口可能需要修改以支持多张牌
      playerIndex,
      cardIds: selectedCardIds.value
    });
    if (updatedCards.length > 0) {
      selectedCardIds.value = [];  // 清空选中的卡片
    } else {
      alert("操作失败");
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

