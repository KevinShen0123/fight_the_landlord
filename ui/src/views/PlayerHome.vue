<template>
  <div class="player-page">
    <h1>Player Dashboard</h1>
    <p>Ready to start a new game or continue where you left off?</p>
    <div class="button-group">
      <b-button variant="success" @click="goToGame" class="action-button">Start Game</b-button>
      <b-button variant="success" @click="goToSettings" class="action-button">Settings</b-button>
    </div>
  </div>
</template>
  
  <script setup lang="ts">
  import { useRouter } from 'vue-router';
  
  const router = useRouter();
  
  function goToGame() {
    router.push({ name: 'Game' });
  }
  function goToSettings() {
    router.push({ name: 'Settings' });
  }
  </script>
  
  <style scoped>
  .player-page {
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center; 
    text-align: center; 
  }
  
  .button-group {
    margin-top: 20px; 
    display: flex;
    justify-content: center; 
    gap: 15px;
  }
  
  .action-button {
    padding: 10px 20px; 
    min-width: 120px; 
  }
  </style>
  