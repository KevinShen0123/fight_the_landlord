<template>
     <div>{{ sender }} Chat with {{ receiver }}</div>
     <div v-for="(chat, index) in allchats" :key="index">
        <div v-if="chat[0]==receiver&&chat[2]==sender">
           {{ chat[0] }}: {{ chat[1] }}
        </div>
        <div v-if="chat[0]==sender&&chat[2]==receiver">
           {{ chat[0] }}: {{ chat[1] }}
        </div>
    </div>
  <div>
    <input style="margin-left:90px;margin-top:600px;width: 1000px;height:50px" type="text" v-model="chatinput">
    <button @click="sendChat">Send Chat</button>
    <!-- <div v-for="(chat, index) in allchats" :key="index">
         <div v-if="chat.sender==receiver&&chat.receiver==sender">
            {{ chat.sender }}:{{ chat.chatcontent }}
         </div>
         <div v-if="chat.sender==sender&&chat.receiver==receiver">
            {{ chat.sender }}:{{ chat.chatcontent }}
         </div>
    </div> -->
  </div>
</template>
<script setup lang="ts">
import {computed,onMounted,ref} from 'vue'
import { areCompatible } from "../../../server/model"
import { useRouter,useRoute } from 'vue-router'
import { io } from "socket.io-client"
const chatinput=ref("")
const route=useRoute()
const sender=computed(() => route.query.sender)
const receiver=computed(() => route.query.receiver)
const socket=io()
const allchats = ref([])
var callOnmount=ref(0)
// socket.on("allchats",(sender,chatinput,receiver)=>{
//   alert("new chat received")
//   alert(sender)
// })
async function updateCallOnMount(){
   socket.emit("getallchat")
   socket.on("allchat",plists=>{
   allchats.value=plists
   console.log("UUUUUUUUUUUUUUUUUU")
   console.log(allchats.value.length)
   console.log("PPPPPPPPPPPPPPPPPPPPPPP")
})
}
setInterval(updateCallOnMount, 200);
async function sendChat(){
var paramlist=[sender.value,chatinput.value,receiver.value]
socket.emit("clientchat",paramlist)
chatinput.value=""
}
</script>