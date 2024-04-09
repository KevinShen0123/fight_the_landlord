<template>
  <div class="login-container">
    <h1>Login as:</h1>

    <b-form-radio-group v-model="role" :options="roles"></b-form-radio-group>

    <b-button @click="login" variant="primary">Login</b-button>
  </div>
</template>

<script setup>
import { inject, ref } from 'vue'

const roles = [
  { text: 'Player', value: 'player' },
  { text: 'Administrator', value: 'admin' },
]



function login() {
  const loginUrl = `/api/login` 
  window.location.href = loginUrl 
 
  
}
</script>

<style>

.login-container {
  max-width: 400px;
  margin: auto;
  padding: 20px;
}
</style>
