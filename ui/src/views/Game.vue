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
            v-for="card in lplaycards"
            :key="card.id"
            :card="card"
            :includeLocation="true"
            :lastPlayedCard="lastPlayedCard"d
            @cardClick="playCard(card.id)"
          />
      </div>
      </div>

      <div class="play-board">
        <div class="opponent-info left-opponent">
          <!-- Left opponent's info -->
          <div v-if="opponents[0]" class="opponent" @click="chatWith(opponents[0].name)">
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
               <b-button :disabled="!myTurn" @click="pass">Pass</b-button>
          </div>
          
         
        </div>
        
      

        <div class="opponent-info right-opponent">
          <!-- Right opponent's info -->
          <div v-if="opponents[1]" class="opponent" @click="chatWith(opponents[1].name)">
            <b-badge variant="info">{{ opponents[1].name }}</b-badge>
            <b-badge variant="warning">Cards: {{ opponents[1].cardCount }}</b-badge>
          </div>
        </div>
      </div>
    </div> 
  </div>
</template>

<script setup lang="ts">
import { computed, ref, Ref } from 'vue'
import { io } from "socket.io-client"
import { Card, GamePhase, Action, CardId } from "../model"
import AnimatedCard from "./AnimatedCard.vue"
import { useRouter } from 'vue-router'
const router=useRouter()


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



const opponents = ref([{ name: '123', cardCount: 0 }, { name: '234', cardCount: 0 }]);
const socket = io()
// let x = props.playerIndex
// let playerIndex: number | "all" = parseInt(x) >= 0 ? parseInt(x) : "all"
// console.log("playerIndex", JSON.stringify(playerIndex))
// socket.emit("player-index", playerIndex)
// if(playerIndex==0){
//   alert("Landlord")
// }else{
//   alert("peasant")
// }

const playerIndex: Ref<number | "all"> = ref("all")

const cards: Ref<Card[]> = ref([])
const currentTurnPlayerIndex = ref(-1)
const phase = ref("")
const playCount = ref(-1)
const lastPlayedCards:Ref<Card[]>=ref([])
const myTurn = computed(() => currentTurnPlayerIndex.value === playerIndex.value && phase.value !== "game-over")
socket.on("opponent-info", (opponentInfo) => {
 
 opponents.value = opponentInfo;
});
socket.on("all-cards", (allCards: Card[]) => {
  cards.value = allCards
})

socket.on("updated-cards", (updatedCards: Card[]) => {
  applyUpdatedCards(updatedCards)
})

socket.on("game-state", (newPlayerIndex: number, newCurrentTurnPlayerIndex: number, newPhase: GamePhase, newPlayCount: number,lastPlayedCardsArr:Card[]) => {
  if (newPlayerIndex != null) {
    playerIndex.value = newPlayerIndex
  }
  currentTurnPlayerIndex.value = newCurrentTurnPlayerIndex
  phase.value = newPhase
  playCount.value = newPlayCount
  lastPlayedCards.value=lastPlayedCardsArr
})

function doAction(action: Action) {
  return new Promise<Card[]>((resolve, ) => {
    socket.emit("action", action)
    if(action.action!=="Pass"){
      socket.once("updated-cards", (updatedCards: Card[]) => {
      resolve(updatedCards)
    })
    }
  })
}

// async function drawCard() {
//   if (typeof playerIndex.value === "number") {
//     const updatedCards = await doAction({ action: "draw-card", playerIndex: playerIndex.value })
//     if (updatedCards.length === 0) {
//       alert("didn't work")
//     }
//   }
// }

async function playCard(cardId: CardId) {
  if (typeof playerIndex.value === "number") {
    const updatedCards = await doAction({ action: "play-card", playerIndex: playerIndex.value, cardId })
    if (updatedCards.length === 0) {
      alert("didn't work")
    }
  }
}
async function pass(){
  if(typeof playerIndex.value ==="number"){
     await doAction({ action: "Pass", playerIndex: playerIndex.value})
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

//有问题
 function chatWith(opponentName:string) {
  var opponentindex=0
  if(opponentName=="player1"){
    opponentindex=0
  }else if(opponentName=="player2"){
    opponentindex=1
  }else if(opponentName=="Player3"){
    opponentindex=2
  }
  router.push({
  path: 'Chat' + "/" + playerIndex.value + "/" + opponentindex,
  query: {
    sender: playerIndex.value, 
    receiver: opponentindex
  }
});

}
async function playSelectedCards() {
  if (selectedCardIds.value.length > 0 && typeof playerIndex.value  === "number") {
    const updatedCards = await doAction({
      action: "play-cards",  
      playerIndex: playerIndex.value ,
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
  height: auto; 
  min-height: 85vh; 
  overflow: visible; 
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
