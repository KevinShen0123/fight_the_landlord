<template>
  <div>
    <b-navbar toggleable="lg" type="dark" :variant="user?.roles?.includes('Admin') ? 'info' : 'primary'">
      <b-navbar-brand href="#">
        <span v-if="user?.preferred_username">Welcome, {{ user.preferred_username }}</span>
        <span v-else>Card Game</span>
      </b-navbar-brand>
      <b-navbar-nav>
        <b-nav-item v-if="user?.preferred_username == null" href="/api/login">Login</b-nav-item>
        <b-nav-item v-if="user?.preferred_username && gameState?.isGameOver" :to="{ name: 'Home' }">Home</b-nav-item> 
        <b-nav-item v-if="user?.preferred_username" @click="logout">Logout</b-nav-item>
        <form method="POST" action="/api/logout" id="logoutForm" />

      </b-navbar-nav>
    </b-navbar>
    <router-view/>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, provide,reactive } from 'vue'

const user = ref({} as any)
provide("user", user)
interface GameState {
  isGameOver: boolean;
}
const gameState = reactive<GameState>({
  isGameOver: true
});
provide('gameState', gameState)

onMounted(async () => {
  user.value = await (await fetch("/api/user")).json()
})

function logout() {
  ;(window.document.getElementById('logoutForm') as HTMLFormElement).submit()  
}


</script>