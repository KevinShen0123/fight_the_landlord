<template>
  <div class="statistics">
    <b-container>
      <h1>Game Statistics</h1>
      <b-table striped hover :items="usersStatistics" :fields="fields" @head-clicked="changeSort">
        <template #cell(actions)="{ item }">
          <b-button size="sm" variant="danger" @click="clearUserData(item.username)">Clear Data</b-button>
        </template>
        
        <template #head({ key, label, sortable })>
          <span v-if="sortable" @click="() => changeSort(key)">
            {{ label }} <!-- 显示字段的标签 -->
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

const usersStatistics = ref([]);
const currentSort = ref({ sortBy: 'gamesPlayed', sortDesc: false });
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
      console.error('Failed to load user statistics');
    }
  } catch (error) {
    console.error('Error fetching user statistics:', error);
  }
}

onMounted(async () => {
  fetchUsersStatistics();
});

function changeSort(sortBy) {
  if (currentSort.value.sortBy === sortBy) {
    // Toggle the direction of sorting
    currentSort.value.sortDesc = !currentSort.value.sortDesc;
  } else {
    // Change the sorting field and set the default sorting direction
    currentSort.value.sortBy = sortBy;
    currentSort.value.sortDesc = false;
  }
  fetchUsersStatistics();
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
</script>

<style scoped>
.statistics {
  padding: 20px;
}
.sortable-header:hover {
  cursor: pointer;
  text-decoration: underline;
}
</style>
