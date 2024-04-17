<template>
   <div v-if="errorMessage" class="alert alert-danger fade show" role="alert">
        {{ errorMessage }}
    </div>

    <div v-else class="user-settings" v-if="user && user.preferred_username">
      <b-container>
        <h1>{{ user.preferred_username }}'s Settings</h1>
        <b-form @submit.prevent="updateSettings">
          <b-form-group label="Username" label-for="username">
            <b-form-input id="username" readonly :value="user.preferred_username"></b-form-input>
          </b-form-group>
  
          <b-form-group label="Score" label-for="score">
            <b-form-input id="score" readonly :value="settings.score" placeholder="Current score"></b-form-input>
          </b-form-group>
  
          <b-form-group label="Games Played" label-for="gamesPlayed">
            <b-form-input id="gamesPlayed" readonly :value="settings.gamesPlayed" placeholder="Number of games played"></b-form-input>
          </b-form-group>
  
          <b-form-group label="Games Won" label-for="gamesWon">
            <b-form-input id="gamesWon" readonly :value="settings.gamesWon" placeholder="Number of games won"></b-form-input>
          </b-form-group>
  
          <b-form-group label="Total Play Time (minutes)" label-for="totalPlayTime">
            <b-form-input id="totalPlayTime" readonly :value="settings.totalPlayTime" placeholder="Total play time in minutes"></b-form-input>
          </b-form-group>


          <b-form-group label="Personal Information" label-for="personalInformation">
            <b-form-input id="personalInformation" v-model="settings.personalInformation" placeholder="Please enter your personal information"></b-form-input>
          </b-form-group>
  
          <b-button type="submit" variant="primary">Update Settings</b-button>
        </b-form>
      </b-container>
    </div>

   
  </template>
  
  <script setup lang="ts">
  import { ref, inject, onMounted,Ref } from 'vue';
  import { watchEffect } from 'vue';

  const user: Ref<any> = inject("user")!
  const settings = ref({
    score: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    totalPlayTime: 0,
    personalInformation: ""
  });

  const errorMessage = ref('');


  onMounted(() => {
   
   
  watchEffect(() => {
    
    if (user.value && user.value.preferred_username) {
      (async () => {
        try {
          const response = await fetch(`/api/settings/${user.value.preferred_username}`, {
            method: 'GET', 
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) { 
            const data = await response.json();
            settings.value = data;
          } else {
            errorMessage.value = 'Failed to load settings. You do not have permissions';
          }
        } catch (error) {
          errorMessage.value  = "Error fetching settings:" ;
        }
      })();
    }
  });
});


  
  async function updateSettings() {
    if (user.value && user.value.preferred_username) {
      try {
        const response = await fetch(`/api/settings/${user.value.preferred_username}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(settings.value),
        });


  
        if (response.ok) {
          console.log('Settings updated successfully!');
        } else {
          console.log('Failed to update settings.');
        }
      } catch (error) {
        console.error("Error updating settings:", error);
      }
    }
  }

  
  </script>

  <style>
  .alert {
  transition: opacity 0.5s ease-in-out;
}
</style>
  