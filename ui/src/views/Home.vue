<template>
    <div class="home">
      <b-container>
      
        <div v-if="!user.name">
          <h1>Welcome to the Card Game!</h1>
          <p>This is a fun and engaging card game you can play with friends or solo.</p>
          <b-button href="/api/login" variant="primary">Login to Play</b-button>
        </div>
  
       
        <div v-else>
          <h1>Welcome back, {{ user.name }}!</h1>
          <p>Ready to start a new game or continue where you left off?</p>
          <b-button @click="goToGame" variant="success">Start Game</b-button>
        </div>
      </b-container>
    </div>
  </template>
  
  <script setup lang="ts">
  import { inject } from 'vue';
  import { useRouter } from 'vue-router';
  
  const router = useRouter()
  const user = inject('user');


  
  function goToGame() {
    router.push({ name: 'Game' }); 
  }
  </script>
  
  <style>
  .home {
    text-align: center;
    margin-top: 50px;
  }
  </style>
  