<template>
    <div>
      {{ username }}
    </div>
</template>
<script setup lang="ts">
import { useRoute } from 'vue-router';
const route = useRoute();
const username = route.params.username as string; 

</script>