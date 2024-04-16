<template>
  <div>
    <b-button class="mx-2 my-2" size="sm" @click="socket.emit('new-game')">New Game</b-button>
    <b-badge class="mr-2 mb-2" :variant="myTurn ? 'primary' : 'secondary'">turn: {{ currentTurnPlayerIndex }}</b-badge>
    <b-badge class="mr-2 mb-2">{{ phase }}</b-badge>
    <b-button class="mx-2 my-2" size="sm" @click="drawCard" :disabled="!myTurn">Draw Card</b-button>
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
            :key="card.id"
            :card="card"
            :includeLocation="true"
            :lastPlayedCard="lastPlayedCard"
            @cardClick="playCard(card.id)"
          />
      </div>
      </div>



      <!-- <div class="bottom-container">
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
      </div> -->
      <div class="play-board">
        <div class="opponent-info left-opponent">
          <!-- Left opponent's info -->
          <div v-if="opponents[0]" class="opponent" @click="chatWith(opponents[0].name, opponents[0].cardCount)">
            <b-badge variant="info">{{ opponents[0].name }}</b-badge>
            <b-badge variant="warning">Cards: {{ opponents[0].cardCount }}</b-badge>
          </div>
        </div>

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

          <div class="button-container">
               <b-button size="sm" @click="playSelectedCards" :disabled="!myTurn || selectedCardIds.length === 0">Play Selected Cards</b-button> 
          </div>
          
         
        </div>
        
      

        <div class="opponent-info right-opponent">
          <!-- Right opponent's info -->
          <div v-if="opponents[1]" class="opponent" @click="chatWith(opponents[1].name, opponents[1].cardCount)">
            <b-badge variant="info">{{ opponents[1].name }}</b-badge>
            <b-badge variant="warning">Cards: {{ opponents[1].cardCount }}</b-badge>
          </div>
        </div>
      </div>
    </div> 
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

//new add 4/15
const opponents = ref([{ name: '123', cardCount: 0 }, { name: '234', cardCount: 0 }]);
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

//new add 4/15
socket.on("opponent-info", (opponentInfo) => {
 
  opponents.value = opponentInfo;
});

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

//new add on 4/15
function chatWith(opponentName:string, cardCount:number) {
  alert(`Opponent: ${opponentName} - Cards: ${cardCount}`);
}

async function playSelectedCards() {
  if (selectedCardIds.value.length > 0 && typeof playerIndex === "number") {
    const updatedCards = await doAction({
      action: "play-cards",  
      playerIndex,
      cardIds: selectedCardIds.value
    });
    if (updatedCards.length > 0) {
      selectedCardIds.value = []; 
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
  justify-content: space-between;
  height: auto; /* 改为自动高度以适应内容 */
  min-height: 85vh; /* 至少保持原有高度 */
  overflow: visible; /* 确保内容可以显示 */
}

.title {
  margin-bottom: 20px; 
  text-align: center; 
}
.cards-container {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
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

.card-pile {
  display: flex;
  flex-direction: column;
  align-items: center; 
  justify-content: center; 
  margin-top: 20px; 
}

.card-pile h1 {
  text-align: center; 
  margin-bottom: 10px; 
}




.play-board {
  display: flex;
  justify-content: space-between; 
  align-items: flex-start;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
}

.opponent-info {
  width: 150px; 
  flex-shrink: 0; 
  display: flex;
  flex-direction: column;
  align-items: center;
}

.opponent {
  display: flex;
  flex-direction: column; 
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 2em;
}

.left-opponent {
  margin-right: auto; 
}

.right-opponent {
  margin-left: auto; 
}

.your-cards {
  flex-grow: 1; 
  display: flex;
  flex-direction: column; /* 添加这一行来堆叠子元素 */
  align-items: center; /* 中心对齐子元素 */
  margin-bottom: 5px; /* 确保与下方内容有足够的间距 */
}


.your-cards h1 {
  margin-bottom: 20px; /* 分隔标题和卡牌 */
}

.your-cards .cards-container {
  display: flex;
  justify-content: flex-start; /* 对齐到容器的起始位置 */
  flex-wrap: wrap; /* 允许卡牌换行 */
  gap: 10px;
  height: 240px; /* 设置固定高度以确保有两行的空间 */
  align-content: flex-start; /* 垂直方向上对齐到起始边缘 */
}


.your-cards .button-container {
  display: flex;
  justify-content: center; /* 居中按钮 */
  margin-top: 20px; /* 从卡牌区域向下留出一些空间 */
}


</style>

