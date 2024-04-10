<template>
    <div class="player-page">
      <h1>Player Dashboard</h1>
      <p>Ready to start a new game or continue where you left off?</p>
      <b-button variant="success" @click="goToGame">Start Game</b-button>
      <b-button variant="success" @click="goToSettings">Settings</b-button>

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
  }
  </style>
  