<template>
    <div class="statistics">
      <b-container>
        <h1>Game Statistics</h1>
        <b-row>
          <b-col>
            <b-card
              title="Total Games Played"
              class="mb-2"
            >
              <p class="card-text">{{ totalGames }}</p>
            </b-card>
          </b-col>
          <b-col>
            <b-card
              title="Games Won"
              class="mb-2"
            >
              <p class="card-text">{{ gamesWon }}</p>
            </b-card>
          </b-col>
          <b-col>
            <b-card
              title="Games Lost"
              class="mb-2"
            >
              <p class="card-text">{{ gamesLost }}</p>
            </b-card>
          </b-col>
        </b-row>
      </b-container>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  
  const totalGames = ref(0);
  const gamesWon = ref(0);
  const gamesLost = ref(0);
  
  onMounted(async () => {
 
    totalGames.value = 100;
    gamesWon.value = 70;
    gamesLost.value = totalGames.value - gamesWon.value;
  });
  </script>
  
  <style scoped>
  .statistics {
    padding: 20px;
  }
  </style>
  