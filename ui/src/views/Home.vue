<template>

    <b-sidebar v-model:visible="showSidebar" title="Menu" shadow>
      <b-nav vertical>
        <b-nav-item v-if="selectedRole === 'admin'" :to="{ name: 'Statistics' }">Statistics</b-nav-item>
        <b-nav-item v-if="selectedRole === 'player'" :to="{ name: 'Settings' }">Settings</b-nav-item>
      </b-nav>
    </b-sidebar>
    <div class="home">
      <b-container>
      
        <div v-if="!user.name">
          <h1>Welcome to the Card Game!</h1>
          <p>This is a fun and engaging card game you can play with friends or solo.</p>
          <b-button href="/api/login" variant="primary">Login to Play</b-button>
        </div>

       
        <div v-else>
          <h1>Welcome back, {{ user.name }}!</h1>

          <div v-if="user.groups.length === 1">
            <div v-if="user.groups && user.groups.includes('fight-admin') ">
            <p>You have Admin access to the Card Game.</p>
   
          </div>
          <div v-else-if="user.groups && user.groups.includes('fight-player')">
            <p>Ready to start a new game or continue where you left off?</p>
            <b-button @click="goToGame" variant="success">Start Game</b-button>
          </div>
          <div v-else>
            <p>Your access level is unknown. Please contact support.</p>
          </div>
          </div>


          <div v-else>
          <p>Please select your role:</p>
          <b-button v-if="user.groups.includes('fight-admin')" @click="selectRole('admin')">Admin</b-button>
          <b-button v-if="user.groups.includes('fight-player')" @click="selectRole('player')">Player</b-button>
          </div>


          <div v-if="selectedRole === 'admin'">
            <p>You have Admin access to the Card Game.</p>
          </div>
          <div v-else-if="selectedRole === 'player'">
            <p>Ready to start a new game or continue where you left off?</p>
            <b-button @click="goToGame" variant="success">Start Game</b-button>
          </div>

       
        </div>



      </b-container>
    </div>
  </template>
  
  <script setup lang="ts">
  import { inject,ref } from 'vue';
  import { useRouter } from 'vue-router';

  const router = useRouter()
  const user = inject('user');

  const showSidebar = ref(false); // 控制侧边栏显示


//   onMounted(() => {
//   watchEffect(() => {
//     if (user.value && user.value.name) {
  
//       (async () => {
//         try {
   
//         } catch (error) {
//           console.error("Error fetching settings:", error);
//         }
//       })();
//     }
//   });
// });


  const selectedRole = ref('');
  function selectRole(role) {
  selectedRole.value = role;


}
  
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
  