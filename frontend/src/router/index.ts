import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProductView from '../views/ProductView.vue'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView
        },
        {
            path: '/product/:id',
            name: 'product',
            component: ProductView,
            props: true
        },
        {
            path: '/sys-admin-control',
            name: 'admin',
            component: () => import('../views/AdminView.vue')
        }
    ]
})

export default router
