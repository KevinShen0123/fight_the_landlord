import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { BootstrapVue, BootstrapVueIcons } from 'bootstrap-vue'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import App from './App.vue'
import Game from './views/Game.vue'
import Chat from "./views/Chat.vue"
const routes = [
	{
		path: "/:playerIndex",
		component: Game,
		props (route) {
			return {
				playerIndex: route.params.playerIndex
			}
		}
	},
	{
		path: "/chat/:username",
		component:Chat ,
		// Optionally, you can add props or any other route configurations here
	  },
]

const router = createRouter({
	history: createWebHistory(),
	routes,
})

createApp(App)
	.use(BootstrapVue)
	.use(BootstrapVueIcons)
	.use(router)
	.mount('#app')
