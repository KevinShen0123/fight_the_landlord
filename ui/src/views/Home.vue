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
       
          <!-- <p>Please select your role:</p>
          <b-button v-if="user.groups.includes('fight-admin')" @click="selectRole('admin')">Admin</b-button>
          <b-button v-if="user.groups.includes('fight-player')" @click="selectRole('player')">Player</b-button>
         -->
        
        
        <AdminHome v-if="user?.roles?.includes('Admin')" />
        <PlayerHome v-if="user?.roles?.includes('Player')" />
      </div>
       
      
      <b-button v-if="(user.groups?.length || 0) >= 2" @click="switchRole" variant="warning">Switch Role</b-button>
 


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
    alert('Role updated successfully!');
  } else {
    alert('Failed to update Roles.');
  }
}


  </script>
  
  <style>
  .home {
    text-align: center;
    margin-top: 50px;
  }
  </style>
  