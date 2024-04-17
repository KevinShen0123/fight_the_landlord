<template>
     <div>{{ sender }} Chat with {{ receiver }}</div>
  <div>
    <input style="margin-left:90px;margin-top:600px;width: 1000px;height:50px" type="text" v-model="chatinput">
    <button>Send Chat</button>
  </div>
</template>
<script setup="ts">
import {computed,ref} from 'vue'
import { areCompatible,ChatText } from "../../../server/model"
import { useRouter,useRoute } from 'vue-router'
const chatinput=ref("")
const route=useRoute()
const sender=computed(() => route.query.sender)
const receiver=computed(() => route.query.receiver)

</script>