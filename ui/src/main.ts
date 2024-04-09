import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { BootstrapVue, BootstrapVueIcons } from 'bootstrap-vue'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import App from './App.vue'
import Game from './views/Game.vue'
import HomePage from './views/Home.vue'
import Setting  from './views/Setting.vue'
import Login from './views/Login.vue'
import Statistics from './views/Statistics.vue'
import AdminHome from './views/AdminHome.vue'
import PlayerHome from './views/PlayerHome.vue'
const routes = [
  {
    path: "/",
    component: HomePage,
    name: 'Home',
  },
  {
    path: "/game",
    component: Game,
    name: 'Game',
  },
  {
    path: "/settings",
    component: Setting,
    name: "Settings"
  },
  {
    path: "/statistics",
    name: "Statistics",
    component: Statistics,

  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  { path: '/admin', name: 'AdminPage', component: AdminHome },
  { path: '/player', name: 'PlayerPage', component: PlayerHome },

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
