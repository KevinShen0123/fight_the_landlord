<template>
    <div class="admin-page">
      <h1>Admin Dashboard</h1>
      <p>You have Admin access to the Card Game.</p>
      <b-button variant="success" @click="goToStatics">Statistics</b-button>
   
    </div>
  </template>
  
  <script setup lang="ts">

import { useRouter } from 'vue-router';
  
  const router = useRouter();
      function goToStatics() {
    router.push({ name: 'Statistics' });
  }
  </script>
  
  <style scoped>
  .admin-page {
    padding: 20px;
  }
  </style>