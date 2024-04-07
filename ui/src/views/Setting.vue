<template>
    <div class="user-settings" v-if="user && user.name">
      <b-container>
        <h1>{{ user.name }}'s Settings</h1>
        <b-form @submit.prevent="updateSettings">
          <b-form-group label="Username" label-for="username">
            <b-form-input id="username" readonly :value="user.name"></b-form-input>
          </b-form-group>
  
          <b-form-group label="Score" label-for="score">
            <b-form-input id="score" v-model="settings.score" placeholder="Current score"></b-form-input>
          </b-form-group>
  
          <b-form-group label="Games Played" label-for="gamesPlayed">
            <b-form-input id="gamesPlayed" v-model="settings.gamesPlayed" placeholder="Number of games played"></b-form-input>
          </b-form-group>
  
          <b-form-group label="Games Won" label-for="gamesWon">
            <b-form-input id="gamesWon" v-model="settings.gamesWon" placeholder="Number of games won"></b-form-input>
          </b-form-group>
  
          <b-form-group label="Total Play Time (minutes)" label-for="totalPlayTime">
            <b-form-input id="totalPlayTime" v-model="settings.totalPlayTime" placeholder="Total play time in minutes"></b-form-input>
          </b-form-group>
  
          <b-button type="submit" variant="primary">Update Settings</b-button>
        </b-form>
      </b-container>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, inject, onMounted } from 'vue';
  import { watchEffect } from 'vue';

  const user = inject('user');
  const settings = ref({
    score: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    totalPlayTime: 0,
  });

  

  onMounted(() => {
  watchEffect(() => {
    if (user.value && user.value.name) {
    
      (async () => {
        try {
         
          const response = await fetch(`/api/settings/${user.value.name}`, {
            method: 'GET', 
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {    
            const data = await response.json();

          
          
            settings.value = data;
          } else {
            console.error("Failed to fetch settings");
          }
        } catch (error) {
          console.error("Error fetching settings:", error);
        }
      })();
    }
  });
});


  
  async function updateSettings() {
    // if (user.value && user.value.name) {
    //   try {
    //     const response = await fetch(`/api/settings/${user.value.name}`, {
    //       method: 'PUT',
    //       headers: {
    //         'Content-Type': 'application/json',
    //       },
    //       body: JSON.stringify(settings.value),
    //     });
  
    //     if (response.ok) {
    //       alert('Settings updated successfully!');
    //     } else {
    //       alert('Failed to update settings.');
    //     }
    //   } catch (error) {
    //     console.error("Error updating settings:", error);
    //   }
    // }
  }

  
  </script>
  