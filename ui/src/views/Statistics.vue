<template>
  <div v-if="errorMessage" class="alert alert-danger fade show" role="alert">
        {{ errorMessage }}
    </div>
  <div v-else class="statistics" v-if="user && user.name">
    <b-container>
      <h1>Game Statistics</h1>
      <b-button variant="primary" @click="refresh">Refresh</b-button>
      <b-table striped hover :items="usersStatistics" :fields="fields" @head-clicked="handleHeadClicked">
        <template #cell(actions)="{ item }">
          <b-button size="sm" variant="danger" @click="clearUserData(item.username)">Clear Data</b-button>
        </template>
        
        <template #head({ key, label, sortable })>
          <span v-if="sortable" @click="() => changeSort(key)" class="sortable-header">
            {{ label }}
          </span>
          <span v-else>
            {{ label }}
          </span>
        </template>
      </b-table>
    </b-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { BButton } from 'bootstrap-vue';
const errorMessage = ref('');
const usersStatistics = ref([]);
const currentSort = ref({ sortBy: 'gamesPlayed', sortDesc: true });
const fields = [
  { key: 'username', label: 'Username', sortable: false },
  { key: 'gamesPlayed', label: 'Games Played', sortable: true },
  { key: 'gamesWon', label: 'Games Won', sortable: true },
  { key: 'lastLogin', label: 'Last Login', sortable: false, formatter: (value) => new Date(value).toLocaleString() },
  { key: 'score', label: 'Score', sortable: true },
  { key: 'totalPlayTime', label: 'Total Play Time (minutes)', sortable: false },
  { key: 'actions', label: 'Actions', sortable: false }, 
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
      let data = await response.json();
      data = data.sort((a, b) => {
        const sortField = currentSort.value.sortBy;
        let comparison = 0;
        if (a[sortField] < b[sortField]) {
          comparison = currentSort.value.sortDesc ? 1 : -1;
        } else if (a[sortField] > b[sortField]) {
          comparison = currentSort.value.sortDesc ? -1 : 1;
        }
        return comparison;
      });
      usersStatistics.value = data;
    } else {
      errorMessage.value = 'Failed to load statistics. You do not have permissions';
    }
  } catch (error) {
    errorMessage.value = 'Error fetching user statistics:';
  }
}

onMounted(async () => {
  fetchUsersStatistics();
});
function changeSort(sortBy) {
  const field = fields.find(f => f.key === sortBy);
  if (field && field.sortable) {
    if (currentSort.value.sortBy === sortBy) {
      currentSort.value.sortDesc = !currentSort.value.sortDesc;
    } else {
      currentSort.value.sortBy = sortBy;
      currentSort.value.sortDesc = true; 
    }
    fetchUsersStatistics();
  }
}
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

function handleHeadClicked(key) {
  const field = fields.find(f => f.key === key);
  if (field && field.sortable) {
    changeSort(key);
  }
}

function refresh() {
  fetchUsersStatistics();
}
</script>

<style scoped>
.statistics {
  padding: 20px;
}
.sortable-header:hover {
  cursor: pointer;
  text-decoration: underline;
}
.alert {
  transition: opacity 0.5s ease-in-out;
}

</style>
