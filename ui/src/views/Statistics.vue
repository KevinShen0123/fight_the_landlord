<template>
  <div class="statistics">
    <b-container>
      <h1>Game Statistics</h1>
      <b-table striped hover :items="usersStatistics" :fields="fields">
        <template #cell(actions)="{ item }">
          <b-button size="sm" variant="danger" @click="clearUserData(item.username)">Clear Data</b-button>
        </template>
      </b-table>
    </b-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { BButton } from 'bootstrap-vue';

const usersStatistics = ref([]);
const fields = [
  { key: 'username', label: 'Username' },
  { key: 'gamesPlayed', label: 'Games Played' },
  { key: 'gamesWon', label: 'Games Won' },
  { key: 'lastLogin', label: 'Last Login', formatter: (value) => new Date(value).toLocaleString() },
  { key: 'score', label: 'Score' },
  { key: 'totalPlayTime', label: 'Total Play Time (minutes)' },
  { key: 'actions', label: 'Actions' }, 
];
async function fetchUsersStatistics() {
  try {
    const response = await fetch('/api/statistics/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      usersStatistics.value = data;
    } else {
      console.error('Failed to load user statistics');
    }
  } catch (error) {
    console.error('Error fetching user statistics:', error);
  }
}

onMounted(async () => {
  fetchUsersStatistics();
});

async function clearUserData(username) {
  const response = await fetch(`/api/user/${username}/clear`, {
    method: 'POST', 
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.ok) {
    console.log(`Data cleared for ${username}`);
    await fetchUsersStatistics();
  } else {
    console.error(`Failed to clear data for ${username}`);
  }
}
</script>

<style scoped>
.statistics {
  padding: 20px;
}
</style>