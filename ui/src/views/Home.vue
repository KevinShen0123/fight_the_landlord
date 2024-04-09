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
        <div v-if="!selectedRole">
          <p>Please select your role:</p>
          <b-button v-if="user.groups.includes('fight-admin')" @click="selectRole('admin')">Admin</b-button>
          <b-button v-if="user.groups.includes('fight-player')" @click="selectRole('player')">Player</b-button>
        </div>
        
        
        <AdminHome v-if="selectedRole === 'admin'" />
        <PlayerHome v-if="selectedRole === 'player'" />
      </div>
       
      <div v-if="selectedRole">
  <b-button @click="switchRole" variant="warning">Switch Role</b-button>
</div>



      </b-container>
    </div>
  </template>
  
  <script setup lang="ts">
  import { inject,ref } from 'vue';
  import AdminHome from './AdminHome.vue'; 
  import PlayerHome from './PlayerHome.vue'; 

  import { onMounted } from 'vue';

onMounted(() => {
  const savedRole = localStorage.getItem('selectedRole');
  if (savedRole) {
    selectedRole.value = savedRole;
  }
});

const user = inject('user');
const selectedRole = ref('');

function selectRole(role) {
  selectedRole.value = role;
  localStorage.setItem('selectedRole', role); 
}
function switchRole() {
  selectedRole.value = ''; // 清空当前选择
  localStorage.removeItem('selectedRole'); // 清除localStorage中的保存
}

  </script>
  
  <style>
  .home {
    text-align: center;
    margin-top: 50px;
  }
  </style>
  