const n=`---
title: "Vue.js状态管理与Pinia深度解析"
excerpt: "深入解析Vue.js状态管理的原理与实践，重点介绍Pinia的设计理念、核心特性和最佳实践，帮助开发者掌握现代前端应用的状态管理"
coverImage: "/assets/blog/preview/cover.jpg"
date: "2025-10-06"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/dynamic-routing/cover.jpg"
---

# Vue.js状态管理与Pinia深度解析

## 前言

状态管理是现代前端应用开发中的核心概念，特别是在大型单页应用中，如何有效地管理、共享和同步应用状态成为了一个关键挑战。Vue.js生态系统提供了多种状态管理解决方案，从最初的Vuex到现代的Pinia，状态管理模式不断演进。本文将深入解析Vue.js状态管理的原理与实践，重点介绍Pinia的设计理念、核心特性和最佳实践。

## 状态管理基础

### 为什么需要状态管理

在小型应用中，组件间的状态共享可以通过props和事件实现。但随着应用规模的增长，这种简单的通信方式会面临以下挑战：

1. **多层组件传递**：状态需要通过多层组件传递，形成"prop drilling"
2. **状态同步困难**：多个组件共享状态时，保持一致性变得复杂
3. **状态来源不明**：难以追踪状态的变化来源和影响范围
4. **开发体验下降**：状态逻辑分散在各个组件中，难以维护

\`\`\`javascript
// 没有状态管理的复杂场景
// GrandParent.vue
export default {
  data() {
    return {
      user: { name: 'John', preferences: { theme: 'light' } }
    }
  },
  template: \`
    <div>
      <Parent :user="user" @update-user="updateUser" />
    </div>
  \`,
  methods: {
    updateUser(newUser) {
      this.user = newUser
    }
  }
}

// Parent.vue
export default {
  props: ['user'],
  template: \`
    <div>
      <Child :user="user" @update-user="$emit('update-user', $event)" />
    </div>
  \`
}

// Child.vue
export default {
  props: ['user'],
  methods: {
    changeTheme(newTheme) {
      // 需要通过多层事件冒泡来更新祖先组件的状态
      this.$emit('update-user', {
        ...this.user,
        preferences: {
          ...this.user.preferences,
          theme: newTheme
        }
      })
    }
  }
}
\`\`\`

### 状态管理的基本原则

有效的状态管理应该遵循以下原则：

1. **单一数据源**：应用的状态存储在单一的位置
2. **状态只读**：状态不能直接修改，只能通过特定方式更新
3. **纯函数更新**：使用纯函数描述状态变化
4. **可预测性**：状态变化应该是可预测和可追踪的

\`\`\`javascript
// 状态管理的基本模式示例
const store = {
  state: {
    count: 0,
    user: null
  },
  
  // 获取状态的派生值
  getters: {
    doubleCount: (state) => state.count * 2,
    isLoggedIn: (state) => !!state.user
  },
  
  // 修改状态的唯一方式
  mutations: {
    INCREMENT(state) {
      state.count++
    },
    SET_USER(state, user) {
      state.user = user
    }
  },
  
  // 异步操作
  actions: {
    async login({ commit }, credentials) {
      const user = await api.login(credentials)
      commit('SET_USER', user)
    }
  }
}
\`\`\`

## Vuex核心概念

### Vuex架构

Vuex是Vue官方的状态管理库，它采用集中式存储管理应用的所有组件状态。

\`\`\`javascript
// Vuex Store的基本结构
import { createStore } from 'vuex'

export default createStore({
  // 1. 状态 - 存储应用数据
  state: {
    count: 0,
    todos: [],
    user: null,
    loading: false
  },
  
  // 2. 计算属性 - 从state派生的数据
  getters: {
    doneTodos: (state) => {
      return state.todos.filter(todo => todo.done)
    },
    doneTodosCount: (state, getters) => {
      return getters.doneTodos.length
    },
    getTodoById: (state) => (id) => {
      return state.todos.find(todo => todo.id === id)
    }
  },
  
  // 3. 同步修改状态的方法
  mutations: {
    INCREMENT(state) {
      state.count++
    },
    ADD_TODO(state, todo) {
      state.todos.push(todo)
    },
    SET_LOADING(state, status) {
      state.loading = status
    },
    SET_USER(state, user) {
      state.user = user
    }
  },
  
  // 4. 异步操作和业务逻辑
  actions: {
    addTodo({ commit }, text) {
      const todo = {
        id: Date.now(),
        text,
        done: false
      }
      commit('ADD_TODO', todo)
    },
    
    async fetchTodos({ commit }) {
      commit('SET_LOADING', true)
      try {
        const todos = await api.fetchTodos()
        todos.forEach(todo => {
          commit('ADD_TODO', todo)
        })
      } catch (error) {
        console.error('Failed to fetch todos:', error)
      } finally {
        commit('SET_LOADING', false)
      }
    }
  },
  
  // 5. 模块化 - 将store分割成模块
  modules: {
    auth: {
      namespaced: true,
      state: () => ({
        token: null,
        user: null
      }),
      mutations: {
        SET_TOKEN(state, token) {
          state.token = token
        },
        SET_USER(state, user) {
          state.user = user
        }
      },
      actions: {
        login({ commit }, credentials) {
          // 登录逻辑
        }
      }
    },
    
    products: {
      namespaced: true,
      state: () => ({
        items: [],
        loading: false
      }),
      // ...其他模块配置
    }
  }
})
\`\`\`

### 在组件中使用Vuex

\`\`\`javascript
// 在组件中使用Vuex
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex'

export default {
  computed: {
    // 使用对象展开运算符将state混入computed对象
    ...mapState([
      'count', // 映射 this.count 为 store.state.count
      'loading' // 映射 this.loading 为 store.state.loading
    ]),
    
    // 使用别名映射state
    ...mapState({
      todoCount: state => state.todos.length,
      isLoggedIn: state => !!state.user
    }),
    
    // 使用对象展开运算符将getters混入computed对象
    ...mapGetters([
      'doneTodos',
      'doneTodosCount'
    ]),
    
    // 使用别名映射getters
    ...mapGetters({
      completedTodos: 'doneTodos',
      completedCount: 'doneTodosCount'
    })
  },
  
  methods: {
    // 使用对象展开运算符将mutations混入methods对象
    ...mapMutations([
      'INCREMENT', // 将 this.INCREMENT() 映射为 this.$store.commit('INCREMENT')
      'SET_LOADING' // 将 this.SET_LOADING(status) 映射为 this.$store.commit('SET_LOADING', status)
    ]),
    
    // 使用别名映射mutations
    ...mapMutations({
      increment: 'INCREMENT', // 将 this.increment() 映射为 this.$store.commit('INCREMENT')
      setLoading: 'SET_LOADING' // 将 this.setLoading(status) 映射为 this.$store.commit('SET_LOADING', status)
    }),
    
    // 使用对象展开运算符将actions混入methods对象
    ...mapActions([
      'addTodo', // 将 this.addTodo(text) 映射为 this.$store.dispatch('addTodo', text)
      'fetchTodos' // 将 this.fetchTodos() 映射为 this.$store.dispatch('fetchTodos')
    ]),
    
    // 使用别名映射actions
    ...mapActions({
      add: 'addTodo', // 将 this.add(text) 映射为 this.$store.dispatch('addTodo', text)
      load: 'fetchTodos' // 将 this.load() 映射为 this.$store.dispatch('fetchTodos')
    }),
    
    // 命名空间模块
    ...mapActions('auth', [
      'login' // 将 this.login() 映射为 this.$store.dispatch('auth/login')
    ]),
    
    // 自定义方法
    customMethod() {
      // 直接访问store
      this.$store.state.count
      this.$store.getters.doneTodos
      this.$store.commit('INCREMENT')
      this.$store.dispatch('addTodo', 'New task')
    }
  }
}
\`\`\`

## Pinia核心概念

### Pinia简介

Pinia是Vue的新一代状态管理库，由Vue核心团队成员开发，旨在成为Vuex的继任者。它提供了更简洁的API、更好的TypeScript支持和更直观的开发体验。

\`\`\`javascript
// 安装Pinia
// npm install pinia

// main.js - 安装Pinia
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
\`\`\`

### 定义Store

Pinia的Store定义更加简洁和直观。

\`\`\`javascript
// stores/counter.js
import { defineStore } from 'pinia'

// 使用选项式API定义store
export const useCounterStore = defineStore('counter', {
  // 状态
  state: () => ({
    count: 0,
    name: 'Counter Store'
  }),
  
  // 计算属性
  getters: {
    doubleCount: (state) => state.count * 2,
    doubleCountPlusOne: (state) => {
      return state.count * 2 + 1
    },
    // 可以访问其他getters
    doubleCountPlusOneWithOtherGetter: (state, getters) => {
      return getters.doubleCount + 1
    },
    // 返回函数以支持参数传递
    getUserById: (state) => {
      return (userId) => state.users.find((user) => user.id === userId)
    }
  },
  
  // 方法
  actions: {
    increment() {
      this.count++
    },
    incrementBy(amount) {
      this.count += amount
    },
    async fetchCount() {
      const response = await fetch('https://api.example.com/count')
      const data = await response.json()
      this.count = data.count
    },
    // 可以访问其他actions
    async incrementAndFetch() {
      this.increment()
      await this.fetchCount()
    }
  }
})

// 使用组合式API定义store
import { ref, computed } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  // 状态
  const count = ref(0)
  const name = ref('Counter Store')
  
  // 计算属性
  const doubleCount = computed(() => count.value * 2)
  const doubleCountPlusOne = computed(() => count.value * 2 + 1)
  
  // 方法
  function increment() {
    count.value++
  }
  
  function incrementBy(amount) {
    count.value += amount
  }
  
  async function fetchCount() {
    const response = await fetch('https://api.example.com/count')
    const data = await response.json()
    count.value = data.count
  }
  
  // 返回需要在store中暴露的内容
  return {
    count,
    name,
    doubleCount,
    doubleCountPlusOne,
    increment,
    incrementBy,
    fetchCount
  }
})
\`\`\`

### 在组件中使用Pinia

\`\`\`javascript
// 在组件中使用Pinia
import { useCounterStore } from '@/stores/counter'
import { storeToRefs } from 'pinia'

export default {
  setup() {
    // 获取store实例
    const counterStore = useCounterStore()
    
    // 直接解构会失去响应性
    // const { count, doubleCount } = counterStore // 不推荐
    
    // 使用storeToRefs保持响应性
    const { count, doubleCount, name } = storeToRefs(counterStore)
    
    // 方法可以直接解构
    const { increment, incrementBy, fetchCount } = counterStore
    
    return {
      count,
      doubleCount,
      name,
      increment,
      incrementBy,
      fetchCount
    }
  },
  template: \`
    <div>
      <h2>{{ name }}</h2>
      <p>Count: {{ count }}</p>
      <p>Double Count: {{ doubleCount }}</p>
      
      <button @click="increment">Increment</button>
      <button @click="incrementBy(5)">Increment by 5</button>
      <button @click="fetchCount">Fetch Count</button>
    </div>
  \`
}

// 在选项式API中使用Pinia
export default {
  computed: {
    // 通过this.$pinia访问store
    counterStore() {
      return useCounterStore(this.$pinia)
    },
    
    // 或者直接计算属性
    count() {
      return this.counterStore.count
    },
    
    doubleCount() {
      return this.counterStore.doubleCount
    }
  },
  
  methods: {
    increment() {
      this.counterStore.increment()
    },
    
    incrementBy(amount) {
      this.counterStore.incrementBy(amount)
    }
  }
}
\`\`\`

## Pinia高级特性

### Store订阅

Pinia提供了灵活的订阅机制，可以监听状态变化。

\`\`\`javascript
import { useCounterStore } from '@/stores/counter'

const counterStore = useCounterStore()

// 订阅状态变化
const unsubscribe = counterStore.$subscribe((mutation, state) => {
  // mutation.type: 'direct' | 'patch object' | 'patch function'
  // mutation.storeId: store的id
  // mutation.payload: 传递给patch的参数
  
  console.log('State changed:', mutation.type, state)
  
  // 可以在这里执行持久化逻辑
  localStorage.setItem('counter', JSON.stringify(state))
})

// 取消订阅
// unsubscribe()

// 订阅actions
const unsubscribeActions = counterStore.$onAction(({
  name, // action名称
  store, // store实例
  args, // action参数
  after, // action成功后的钩子
  onError // action失败后的钩子
}) => {
  console.log(\`Action "\${name}" is being called with args:\`, args)
  
  // action成功后执行
  after((result) => {
    console.log(\`Action "\${name}" finished with result:\`, result)
  })
  
  // action失败时执行
  onError((error) => {
    console.error(\`Action "\${name}" failed with error:\`, error)
  })
})

// 取消订阅
// unsubscribeActions()
\`\`\`

### 插件系统

Pinia支持插件系统，可以扩展store的功能。

\`\`\`javascript
// plugins/piniaLogger.js
export function piniaLogger({ store }) {
  // 当store被初始化时调用
  store.$subscribe((mutation, state) => {
    console.log(\`[\${store.$id}] State changed:\`, mutation, state)
  })
  
  store.$onAction(({ name, args, after, onError }) => {
    console.log(\`[\${store.$id}] Action "\${name}" called with:\`, args)
    
    after((result) => {
      console.log(\`[\${store.$id}] Action "\${name}" completed with:\`, result)
    })
    
    onError((error) => {
      console.error(\`[\${store.$id}] Action "\${name}" failed:\`, error)
    })
  })
}

// plugins/piniaPersistence.js
export function piniaPersistence({ store }) {
  // 从localStorage恢复状态
  const savedState = localStorage.getItem(\`pinia-\${store.$id}\`)
  if (savedState) {
    store.$patch(JSON.parse(savedState))
  }
  
  // 订阅状态变化并保存到localStorage
  store.$subscribe((mutation, state) => {
    localStorage.setItem(\`pinia-\${store.$id}\`, JSON.stringify(state))
  })
}

// plugins/piniaReset.js
export function piniaReset({ store }) {
  // 添加reset方法到store
  store.$reset = () => {
    // 获取初始状态
    const initialState = store.$options.state()
    
    // 重置状态
    store.$patch(initialState)
  }
}

// main.js - 使用插件
import { createPinia } from 'pinia'
import { piniaLogger, piniaPersistence, piniaReset } from './plugins'

const pinia = createPinia()

pinia.use(piniaLogger)
pinia.use(piniaPersistence)
pinia.use(piniaReset)

const app = createApp(App)
app.use(pinia)
\`\`\`

### Store组合与扩展

Pinia支持store的组合和扩展，便于复用逻辑。

\`\`\`javascript
// stores/common.js - 公共逻辑
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export function createLoadingStore(id) {
  return defineStore(id, () => {
    const loading = ref(false)
    const error = ref(null)
    
    const isLoading = computed(() => loading.value)
    const hasError = computed(() => !!error.value)
    const errorMessage = computed(() => error.value?.message || '')
    
    function setLoading(status) {
      loading.value = status
    }
    
    function setError(err) {
      error.value = err
    }
    
    function clearError() {
      error.value = null
    }
    
    async function withLoading(promise) {
      try {
        setLoading(true)
        clearError()
        return await promise
      } catch (err) {
        setError(err)
        throw err
      } finally {
        setLoading(false)
      }
    }
    
    return {
      loading,
      error,
      isLoading,
      hasError,
      errorMessage,
      setLoading,
      setError,
      clearError,
      withLoading
    }
  })
}

// stores/user.js - 使用公共逻辑
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createLoadingStore } from './common'

// 创建加载store
const useUserLoadingStore = createLoadingStore('userLoading')

export const useUserStore = defineStore('user', () => {
  // 用户状态
  const user = ref(null)
  const users = ref([])
  
  // 计算属性
  const isLoggedIn = computed(() => !!user.value)
  const userName = computed(() => user.value?.name || '')
  const userCount = computed(() => users.value.length)
  
  // 获取加载store
  const loadingStore = useUserLoadingStore()
  
  // 方法
  async function fetchUsers() {
    return loadingStore.withLoading(
      fetch('https://api.example.com/users')
        .then(response => response.json())
        .then(data => {
          users.value = data
          return data
        })
    )
  }
  
  async function login(credentials) {
    return loadingStore.withLoading(
      fetch('https://api.example.com/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })
        .then(response => response.json())
        .then(data => {
          user.value = data.user
          return data.user
        })
    )
  }
  
  function logout() {
    user.value = null
  }
  
  return {
    // 状态
    user,
    users,
    
    // 计算属性
    isLoggedIn,
    userName,
    userCount,
    
    // 加载状态
    ...loadingStore,
    
    // 方法
    fetchUsers,
    login,
    logout
  }
})
\`\`\`

### TypeScript支持

Pinia提供了出色的TypeScript支持，使类型安全的状态管理变得简单。

\`\`\`typescript
// stores/counter.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 定义状态接口
interface CounterState {
  count: number
  name: string
}

// 定义store
export const useCounterStore = defineStore('counter', () => {
  // 状态 - 使用ref指定类型
  const count = ref<number>(0)
  const name = ref<string>('Counter Store')
  
  // 计算属性 - 自动推断类型
  const doubleCount = computed<number>(() => count.value * 2)
  
  // 方法 - 参数和返回值类型
  function increment(): void {
    count.value++
  }
  
  function incrementBy(amount: number): void {
    count.value += amount
  }
  
  async function fetchCount(): Promise<void> {
    const response = await fetch('https://api.example.com/count')
    const data: { count: number } = await response.json()
    count.value = data.count
  }
  
  return {
    count,
    name,
    doubleCount,
    increment,
    incrementBy,
    fetchCount
  }
})

// 使用选项式API定义store
interface UserState {
  user: User | null
  users: User[]
  loading: boolean
}

interface User {
  id: number
  name: string
  email: string
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    users: [],
    loading: false
  }),
  
  getters: {
    isLoggedIn: (state): boolean => !!state.user,
    userName: (state): string => state.user?.name || '',
    userCount: (state): number => state.users.length
  },
  
  actions: {
    async fetchUsers(): Promise<User[]> {
      this.loading = true
      try {
        const response = await fetch('https://api.example.com/users')
        const users: User[] = await response.json()
        this.users = users
        return users
      } finally {
        this.loading = false
      }
    },
    
    async login(credentials: { email: string; password: string }): Promise<User> {
      this.loading = true
      try {
        const response = await fetch('https://api.example.com/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(credentials)
        })
        
        const data: { user: User } = await response.json()
        this.user = data.user
        return data.user
      } finally {
        this.loading = false
      }
    },
    
    logout(): void {
      this.user = null
    }
  }
})
\`\`\`

## 实际应用案例

### 购物车状态管理

\`\`\`javascript
// stores/cart.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  // 状态
  const items = ref([])
  const couponCode = ref('')
  const discount = ref(0)
  
  // 计算属性
  const itemCount = computed(() => 
    items.value.reduce((total, item) => total + item.quantity, 0)
  )
  
  const subtotal = computed(() => 
    items.value.reduce((total, item) => total + item.price * item.quantity, 0)
  )
  
  const total = computed(() => {
    const subtotalAmount = subtotal.value
    const discountAmount = subtotalAmount * (discount.value / 100)
    return subtotalAmount - discountAmount
  })
  
  const isEmpty = computed(() => items.value.length === 0)
  
  // 方法
  function addItem(product) {
    const existingItem = items.value.find(item => item.id === product.id)
    
    if (existingItem) {
      existingItem.quantity++
    } else {
      items.value.push({
        ...product,
        quantity: 1
      })
    }
  }
  
  function removeItem(productId) {
    const index = items.value.findIndex(item => item.id === productId)
    if (index !== -1) {
      items.value.splice(index, 1)
    }
  }
  
  function updateItemQuantity(productId, quantity) {
    const item = items.value.find(item => item.id === productId)
    if (item) {
      item.quantity = quantity
    }
  }
  
  function clearCart() {
    items.value = []
    couponCode.value = ''
    discount.value = 0
  }
  
  async function applyCoupon(code) {
    try {
      const response = await fetch('https://api.example.com/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      })
      
      const data = await response.json()
      
      if (data.valid) {
        couponCode.value = code
        discount.value = data.discount
        return { success: true, discount: data.discount }
      } else {
        return { success: false, message: data.message }
      }
    } catch (error) {
      return { success: false, message: 'Failed to validate coupon' }
    }
  }
  
  async function checkout() {
    try {
      const response = await fetch('https://api.example.com/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: items.value,
          couponCode: couponCode.value,
          total: total.value
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        clearCart()
        return { success: true, orderId: data.orderId }
      } else {
        return { success: false, message: data.message }
      }
    } catch (error) {
      return { success: false, message: 'Checkout failed' }
    }
  }
  
  return {
    // 状态
    items,
    couponCode,
    discount,
    
    // 计算属性
    itemCount,
    subtotal,
    total,
    isEmpty,
    
    // 方法
    addItem,
    removeItem,
    updateItemQuantity,
    clearCart,
    applyCoupon,
    checkout
  }
})
\`\`\`

### 主题状态管理

\`\`\`javascript
// stores/theme.js
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // 状态
  const theme = ref('light')
  const customColors = ref({})
  const systemTheme = ref('light')
  
  // 计算属性
  const isDark = computed(() => theme.value === 'dark')
  const isLight = computed(() => theme.value === 'light')
  const isCustom = computed(() => theme.value === 'custom')
  
  const currentTheme = computed(() => {
    if (theme.value === 'system') {
      return systemTheme.value
    }
    return theme.value
  })
  
  // 方法
  function setTheme(newTheme) {
    theme.value = newTheme
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }
  
  function setCustomColors(colors) {
    customColors.value = colors
    localStorage.setItem('customColors', JSON.stringify(colors))
    
    if (theme.value === 'custom') {
      applyCustomColors(colors)
    }
  }
  
  function toggleTheme() {
    const newTheme = isDark.value ? 'light' : 'dark'
    setTheme(newTheme)
  }
  
  function applyTheme(themeName) {
    const root = document.documentElement
    
    // 移除所有主题类
    root.classList.remove('theme-light', 'theme-dark', 'theme-custom')
    
    // 添加当前主题类
    root.classList.add(\`theme-\${themeName}\`)
    
    // 应用自定义颜色
    if (themeName === 'custom' && Object.keys(customColors.value).length > 0) {
      applyCustomColors(customColors.value)
    }
  }
  
  function applyCustomColors(colors) {
    const root = document.documentElement
    
    Object.entries(colors).forEach(([property, value]) => {
      root.style.setProperty(\`--color-\${property}\`, value)
    })
  }
  
  function detectSystemTheme() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    systemTheme.value = mediaQuery.matches ? 'dark' : 'light'
    
    // 监听系统主题变化
    mediaQuery.addEventListener('change', (e) => {
      systemTheme.value = e.matches ? 'dark' : 'light'
      
      // 如果当前使用系统主题，则应用新的系统主题
      if (theme.value === 'system') {
        applyTheme(systemTheme.value)
      }
    })
  }
  
  function initTheme() {
    // 从localStorage恢复主题设置
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      theme.value = savedTheme
    } else {
      // 默认使用系统主题
      theme.value = 'system'
    }
    
    // 从localStorage恢复自定义颜色
    const savedColors = localStorage.getItem('customColors')
    if (savedColors) {
      try {
        customColors.value = JSON.parse(savedColors)
      } catch (e) {
        console.error('Failed to parse custom colors:', e)
      }
    }
    
    // 检测系统主题
    detectSystemTheme()
    
    // 应用主题
    applyTheme(theme.value)
  }
  
  // 监听主题变化
  watch(theme, (newTheme) => {
    applyTheme(newTheme)
  })
  
  // 初始化
  initTheme()
  
  return {
    // 状态
    theme,
    customColors,
    systemTheme,
    
    // 计算属性
    isDark,
    isLight,
    isCustom,
    currentTheme,
    
    // 方法
    setTheme,
    setCustomColors,
    toggleTheme,
    initTheme
  }
})
\`\`\`

### 通知状态管理

\`\`\`javascript
// stores/notifications.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotificationsStore = defineStore('notifications', () => {
  // 状态
  const notifications = ref([])
  
  // 方法
  function addNotification(notification) {
    const id = Date.now().toString()
    const newNotification = {
      id,
      type: 'info', // 'info', 'success', 'warning', 'error'
      title: '',
      message: '',
      duration: 5000, // 0表示不自动关闭
      ...notification
    }
    
    notifications.value.push(newNotification)
    
    // 如果设置了持续时间，则自动关闭
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
    
    return id
  }
  
  function removeNotification(id) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }
  
  function clearNotifications() {
    notifications.value = []
  }
  
  // 便捷方法
  function showInfo(message, options = {}) {
    return addNotification({
      type: 'info',
      message,
      ...options
    })
  }
  
  function showSuccess(message, options = {}) {
    return addNotification({
      type: 'success',
      message,
      ...options
    })
  }
  
  function showWarning(message, options = {}) {
    return addNotification({
      type: 'warning',
      message,
      ...options
    })
  }
  
  function showError(message, options = {}) {
    return addNotification({
      type: 'error',
      message,
      duration: 0, // 错误消息默认不自动关闭
      ...options
    })
  }
  
  return {
    // 状态
    notifications,
    
    // 方法
    addNotification,
    removeNotification,
    clearNotifications,
    showInfo,
    showSuccess,
    showWarning,
    showError
  }
})
\`\`\`

## 状态管理最佳实践

### 状态结构设计

良好的状态结构设计是可维护状态管理的基础。

\`\`\`javascript
// 好的状态结构设计
export const useProductStore = defineStore('products', () => {
  // 按功能域划分状态
  const entities = ref({}) // 实体数据，以ID为键
  const ids = ref([]) // ID列表，用于排序
  const loading = ref(false)
  const error = ref(null)
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0
  })
  const filters = ref({
    category: null,
    priceRange: [0, 1000],
    search: ''
  })
  
  // 计算属性
  const products = computed(() => 
    ids.value.map(id => entities.value[id])
  )
  
  const hasProducts = computed(() => ids.value.length > 0)
  
  const totalPages = computed(() => 
    Math.ceil(pagination.value.total / pagination.value.limit)
  )
  
  // 方法
  async function fetchProducts() {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch('https://api.example.com/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          page: pagination.value.page,
          limit: pagination.value.limit,
          filters: filters.value
        })
      })
      
      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`)
      }
      
      const data = await response.json()
      
      // 更新实体数据
      data.products.forEach(product => {
        entities.value[product.id] = product
      })
      
      // 更新ID列表
      ids.value = data.products.map(product => product.id)
      
      // 更新分页信息
      pagination.value.total = data.total
      
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }
  
  function updateProduct(product) {
    entities.value[product.id] = product
  }
  
  function deleteProduct(productId) {
    delete entities.value[productId]
    const index = ids.value.indexOf(productId)
    if (index !== -1) {
      ids.value.splice(index, 1)
    }
  }
  
  function setFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters }
    pagination.value.page = 1 // 重置页码
    fetchProducts()
  }
  
  function setPage(page) {
    pagination.value.page = page
    fetchProducts()
  }
  
  return {
    // 状态
    entities,
    ids,
    loading,
    error,
    pagination,
    filters,
    
    // 计算属性
    products,
    hasProducts,
    totalPages,
    
    // 方法
    fetchProducts,
    updateProduct,
    deleteProduct,
    setFilters,
    setPage
  }
})
\`\`\`

### 异步操作处理

合理处理异步操作是状态管理的关键部分。

\`\`\`javascript
// 异步操作的最佳实践
export const useAsyncStore = defineStore('async', () => {
  const state = ref('idle') // 'idle', 'loading', 'success', 'error'
  const data = ref(null)
  const error = ref(null)
  
  // 通用异步操作处理函数
  async function executeAsync(asyncFn) {
    state.value = 'loading'
    error.value = null
    
    try {
      const result = await asyncFn()
      state.value = 'success'
      data.value = result
      return result
    } catch (err) {
      state.value = 'error'
      error.value = err
      throw err
    }
  }
  
  // 具体的异步操作
  async function fetchData() {
    return executeAsync(async () => {
      const response = await fetch('https://api.example.com/data')
      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`)
      }
      return response.json()
    })
  }
  
  // 计算属性
  const isLoading = computed(() => state.value === 'loading')
  const isSuccess = computed(() => state.value === 'success')
  const isError = computed(() => state.value === 'error')
  const errorMessage = computed(() => error.value?.message || '')
  
  return {
    // 状态
    state,
    data,
    error,
    
    // 计算属性
    isLoading,
    isSuccess,
    isError,
    errorMessage,
    
    // 方法
    executeAsync,
    fetchData
  }
})
\`\`\`

### 模块化与组合

合理组织store，提高代码复用性和可维护性。

\`\`\`javascript
// stores/base.js - 基础store
export function createBaseStore(id, options = {}) {
  return defineStore(id, () => {
    // 基础状态
    const loading = ref(false)
    const error = ref(null)
    
    // 基础计算属性
    const isLoading = computed(() => loading.value)
    const hasError = computed(() => !!error.value)
    const errorMessage = computed(() => error.value?.message || '')
    
    // 基础方法
    function setLoading(status) {
      loading.value = status
    }
    
    function setError(err) {
      error.value = err
    }
    
    function clearError() {
      error.value = null
    }
    
    // 通用异步操作处理
    async function withLoading(asyncFn) {
      try {
        setLoading(true)
        clearError()
        return await asyncFn()
      } catch (err) {
        setError(err)
        throw err
      } finally {
        setLoading(false)
      }
    }
    
    // 合并自定义选项
    const customState = options.state?.() || {}
    const customGetters = options.getters?.({ state: customState, isLoading, hasError, errorMessage }) || {}
    const customActions = options.actions?.({ 
      state: customState, 
      setLoading, 
      setError, 
      clearError, 
      withLoading 
    }) || {}
    
    return {
      // 基础状态
      loading,
      error,
      
      // 基础计算属性
      isLoading,
      hasError,
      errorMessage,
      
      // 基础方法
      setLoading,
      setError,
      clearError,
      withLoading,
      
      // 自定义内容
      ...customState,
      ...customGetters,
      ...customActions
    }
  })
}

// stores/users.js - 使用基础store
export const useUserStore = createBaseStore('users', {
  state: () => ({
    users: [],
    currentUser: null
  }),
  
  getters: ({ state, isLoading, hasError, errorMessage }) => ({
    userCount: () => state.users.length,
    isLoggedIn: () => !!state.currentUser,
    userName: () => state.currentUser?.name || ''
  }),
  
  actions: ({ state, withLoading }) => ({
    async fetchUsers() {
      const users = await withLoading(async () => {
        const response = await fetch('https://api.example.com/users')
        if (!response.ok) {
          throw new Error(\`HTTP error! status: \${response.status}\`)
        }
        return response.json()
      })
      
      state.users = users
      return users
    },
    
    async login(credentials) {
      const user = await withLoading(async () => {
        const response = await fetch('https://api.example.com/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(credentials)
        })
        
        if (!response.ok) {
          throw new Error(\`HTTP error! status: \${response.status}\`)
        }
        
        const data = await response.json()
        return data.user
      })
      
      state.currentUser = user
      return user
    },
    
    logout() {
      state.currentUser = null
    }
  })
})
\`\`\`

## 总结

Vue.js的状态管理经历了从简单的组件间通信到复杂的全局状态管理的演进。Pinia作为新一代状态管理库，提供了以下优势：

1. **简洁的API**：更直观的store定义和使用方式
2. **优秀的TypeScript支持**：原生类型推断和类型安全
3. **模块化设计**：自然的模块化，无需命名空间
4. **灵活性**：支持选项式和组合式API
5. **开发者体验**：更好的调试工具和错误处理

在实际开发中，我们应该：

1. **合理设计状态结构**：按功能域划分，避免过度嵌套
2. **正确处理异步操作**：使用统一的错误处理和加载状态管理
3. **模块化组织store**：提取公共逻辑，提高代码复用性
4. **利用TypeScript**：增强类型安全和开发体验
5. **结合持久化**：使用插件或订阅机制实现状态持久化

通过深入理解Pinia的设计理念和最佳实践，我们能够构建出更加健壮、可维护的Vue应用状态管理系统，为复杂应用提供坚实的数据基础。`;export{n as default};
//# sourceMappingURL=15-C-mtEDmi.js.map
