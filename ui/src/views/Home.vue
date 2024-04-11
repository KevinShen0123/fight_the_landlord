<template>
  <div class="home">
    <b-container class="mt-5">
      
      <b-card v-if="!user.name" class="text-center">
        <h1>Welcome to the Fight the Landlord Card Game!</h1>
        <p>This is a fun traditional Chinese card game.</p>
        <b-button href="/api/login" variant="primary" class="custom-btn">Login to Play</b-button>
      </b-card>

      <b-card v-else class="text-center">
        <h1>Welcome back, {{ user.name }}!</h1>
        <AdminHome v-if="user?.roles?.includes('Admin')" />
        <PlayerHome v-if="user?.roles?.includes('Player')" />

        <b-button 
          v-if="user.groups?.length >= 2 && user.groups.includes('fight-admin') && user.groups.includes('fight-player')"
          @click="switchRole" 
          variant="warning" 
          class="custom-btn">
          Switch Role
        </b-button>
      </b-card>
    </b-container>
  </div>
</template>

  
  <script setup lang="ts">
  import { inject,ref,Ref } from 'vue';
  import AdminHome from './AdminHome.vue'; 
  import PlayerHome from './PlayerHome.vue'; 

  import { onMounted } from 'vue';
  const user: Ref<any> = inject("user")!
  
    async function switchRole() {

  const currentRole = user.value.roles.includes('Admin') ? 'Admin' : 'Player';
  const newRole = currentRole === 'Admin' ? 'Player' : 'Admin';

  const response = await fetch(`/api/changeRole`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ newRole }) 
  });

  if (response.ok) {
    const data = await response.json(); 
    user.value = data; 
  } else {
    console.log('Failed to update Roles.');
  }
}


  </script>
  
  <style>
  .home {
    text-align: center;
  }
  
  b-card {
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
  
  .custom-btn {
    font-weight: bold;
    margin-top: 20px;
    padding: 10px 20px;
    border-radius: 5px;
    transition: background-color 0.3s, box-shadow 0.3s;
  }
  
  .custom-btn:hover {
    background-color: #0056b3;
    box-shadow: 0 0 10px rgba(0,0,0,0.2);
  }
  
  b-button {
    cursor: pointer;
  }
  
  b-container {
    max-width: 800px; /* Adjust the max width of the container */
    margin: auto;
  }
  </style>
  
  