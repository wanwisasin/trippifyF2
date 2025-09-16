// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'
import store from './store' 

createApp(App)
.use(router) 
.use(store) 
.mount('#app')
// import { createApp } from 'vue'
// import './style.css'
// import App from './App.vue'

// createApp(App).mount('#app')
