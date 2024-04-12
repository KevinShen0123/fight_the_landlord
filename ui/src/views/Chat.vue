<template>
  <div>
    <div>Chat History</div>
    <div>{{ username }}</div>
    <!-- Display Forward and Inward Texts in Pairs -->
    <div v-if="forwardtexts.length > 0 && inwardtexts.length > 0">
      <div v-for="(text, index) in forwardtexts" :key="index">
        <div v-if="inwardtexts[index]"> <!-- Ensure both arrays have a corresponding element -->
          <div>Me: {{ text }}</div>
          <div>{{ username }}: {{ inwardtexts[index] }}</div>
        </div>
      </div>
    </div>
    <div>
    <input type="text" v-model="chatinput" placeholder="Enter text" />
    <p>You entered: {{ chatinput }}</p>
    <button @click="sendchat">Send</button>
  </div>
  </div>
</template>
<script setup lang="ts">
import { useRoute } from 'vue-router';
import { getAllObjectsFromTable ,writechat} from '../../../server/model';
import { computed, onMounted, ref, Ref } from 'vue'
import { Socket } from 'socket.io-client';
import { io } from "socket.io-client"
const forwardtexts: Ref<string[]> = ref([])
const inwardtexts:Ref<string[]> = ref([])
const chatinput:Ref<string>=ref("")
const chatnward:Ref<string>=ref("")
const route = useRoute();
const username = route.params.username as string; 
const me=username=="john"?"jane":"john"
const socket=io()
async function fetchData() {
      try {
        const data = await getAllObjectsFromTable();
        const textRecords=data.textRecords
        for(var i=0;i<textRecords.length;i++){
          if(textRecords[i].senderName===username){
            forwardtexts.value.push(textRecords[i].content)
          }else{
            inwardtexts.value.push(textRecords[i].content)
          }
        }
        return data
      } catch (error) {
        console.error('Error:', error);
      }
}
onMounted(fetchData)
async function sendchat(){
  writechat(me,chatinput.value,username)
}
</script>