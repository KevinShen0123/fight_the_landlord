<template>
  <div>
    <b-button class="mx-2 my-2" size="sm" @click="socket.emit('new-game')">New Game</b-button>
    <b-badge class="mr-2 mb-2" :variant="myTurn ? 'primary' : 'secondary'">turn: {{ currentTurnPlayerIndex }}</b-badge>
    <b-badge class="mr-2 mb-2">{{ phase }}</b-badge>
    <div class="cards-wrapper">
      <AnimatedCard
        v-for="card in cards"
        :key="card.id"
        :card="card"
        :includeLocation="true"
        :lastPlayedCard="lastPlayedCard"
        @cardClick="playCard(card.id)"
      />
    </div>
    <b-button class="mx-2 my-2" size="sm" @click="drawCard" :disabled="!myTurn">Draw Card</b-button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, Ref } from 'vue'
import { io } from "socket.io-client"
import { Card, GamePhase, Action, CardId } from "../model"
import AnimatedCard from "./AnimatedCard.vue"
const socket = io()
const playerIndex: Ref<number | "all"> = ref("all")
const lastPlayedCard = ref<Card | null | undefined>(null)
const cards: Ref<Card[]> = ref([])
const currentTurnPlayerIndex = ref(-1)
const phase = ref("")
const playCount = ref(-1)

const myTurn = computed(() => currentTurnPlayerIndex.value === playerIndex.value && phase.value !== "game-over")

socket.on("all-cards", (allCards: Card[]) => {
  cards.value = allCards
})

socket.on("updated-cards", (updatedCards: Card[]) => {
  applyUpdatedCards(updatedCards)
})

socket.on("game-state", (newPlayerIndex: number, newCurrentTurnPlayerIndex: number, newPhase: GamePhase, newPlayCount: number,lastCard: Card) => {
  if (newPlayerIndex != null) {
    playerIndex.value = newPlayerIndex
  }
  if(lastCard)
  {
  
    lastPlayedCard.value = lastCard

  }
  currentTurnPlayerIndex.value = newCurrentTurnPlayerIndex
  phase.value = newPhase
  playCount.value = newPlayCount
})

function doAction(action: Action) {
  return new Promise<Card[]>((resolve,) => {
    socket.emit("action", action)
    socket.once("updated-cards", (updatedCards: Card[]) => {
      resolve(updatedCards)
    })
  })
}

async function drawCard() {
  if (typeof playerIndex.value === "number") {
    const updatedCards = await doAction({ action: "draw-card", playerIndex: playerIndex.value })
    if (updatedCards.length === 0) {
      alert("didn't work")
    }
  }
}

async function playCard(cardId: CardId) {
  if (typeof playerIndex.value === "number") {
    const updatedCards = await doAction({ action: "play-card", playerIndex: playerIndex.value, cardId })
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
</script>


<style>
.cards-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 10px; /* Adjust the gap between cards */
  justify-content: flex-start; /* Align cards to the start of the container */
}
</style>