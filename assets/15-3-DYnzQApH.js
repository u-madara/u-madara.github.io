const n=`---
title: "Vue.js状态管理与Pinia深度解析(3)：实战应用与最佳实践"
excerpt: "通过实际案例展示Pinia在复杂应用中的使用，包括购物车状态管理、主题状态管理、通知状态管理等，以及状态管理的最佳实践"
coverImage: "/assets/blog/dynamic-routing/cover.jpg"
date: "2025-10-05"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/dynamic-routing/cover.jpg"
---

# Vue.js状态管理与Pinia深度解析(3)：实战应用与最佳实践

## 实战应用

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
  
  const totalPrice = computed(() => {
    const subtotal = items.value.reduce((total, item) => {
      return total + (item.price * item.quantity)
    }, 0)
    
    return Math.max(0, subtotal - discount.value)
  })
  
  const isEmpty = computed(() => items.value.length === 0)
  
  const hasCoupon = computed(() => !!couponCode.value)
  
  // 方法
  function addToCart(product, quantity = 1) {
    const existingItem = items.value.find(item => item.id === product.id)
    
    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      items.value.push({
        ...product,
        quantity
      })
    }
    
    // 保存到本地存储
    saveToLocalStorage()
  }
  
  function removeFromCart(productId) {
    const index = items.value.findIndex(item => item.id === productId)
    
    if (index !== -1) {
      items.value.splice(index, 1)
      saveToLocalStorage()
    }
  }
  
  function updateQuantity(productId, quantity) {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    
    const item = items.value.find(item => item.id === productId)
    
    if (item) {
      item.quantity = quantity
      saveToLocalStorage()
    }
  }
  
  function clearCart() {
    items.value = []
    couponCode.value = ''
    discount.value = 0
    saveToLocalStorage()
  }
  
  function applyCoupon(code) {
    // 模拟优惠券验证
    const coupons = {
      'SAVE10': 0.1,
      'SAVE20': 0.2,
      'SAVE30': 0.3
    }
    
    if (coupons[code]) {
      couponCode.value = code
      discount.value = totalPrice.value * coupons[code]
      saveToLocalStorage()
      return true
    }
    
    return false
  }
  
  function removeCoupon() {
    couponCode.value = ''
    discount.value = 0
    saveToLocalStorage()
  }
  
  function checkout() {
    // 模拟结账流程
    return new Promise((resolve) => {
      setTimeout(() => {
        clearCart()
        resolve({ success: true, orderId: 'ORD-' + Date.now() })
      }, 1000)
    })
  }
  
  // 本地存储
  function saveToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify({
      items: items.value,
      couponCode: couponCode.value,
      discount: discount.value
    }))
  }
  
  function loadFromLocalStorage() {
    const savedCart = localStorage.getItem('cart')
    
    if (savedCart) {
      const cart = JSON.parse(savedCart)
      items.value = cart.items || []
      couponCode.value = cart.couponCode || ''
      discount.value = cart.discount || 0
    }
  }
  
  // 初始化时加载本地存储
  loadFromLocalStorage()
  
  return {
    // 状态
    items,
    couponCode,
    discount,
    
    // 计算属性
    itemCount,
    totalPrice,
    isEmpty,
    hasCoupon,
    
    // 方法
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
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
  const currentTheme = ref('light')
  const systemTheme = ref('light')
  const customColors = ref({})
  
  // 预定义主题
  const themes = {
    light: {
      primary: '#1976d2',
      secondary: '#424242',
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#212121',
      textSecondary: '#757575'
    },
    dark: {
      primary: '#90caf9',
      secondary: '#f48fb1',
      background: '#121212',
      surface: '#1e1e1e',
      text: '#ffffff',
      textSecondary: '#b0b0b0'
    },
    blue: {
      primary: '#2196f3',
      secondary: '#ff4081',
      background: '#f3f8ff',
      surface: '#e3f2fd',
      text: '#0d47a1',
      textSecondary: '#1976d2'
    }
  }
  
  // 计算属性
  const isDark = computed(() => currentTheme.value === 'dark')
  const isLight = computed(() => currentTheme.value === 'light')
  const theme = computed(() => themes[currentTheme.value] || themes.light)
  
  // 合并主题和自定义颜色
  const mergedTheme = computed(() => ({
    ...theme.value,
    ...customColors.value
  }))
  
  // CSS变量
  const cssVariables = computed(() => {
    const vars = {}
    
    Object.entries(mergedTheme.value).forEach(([key, value]) => {
      vars[\`--theme-\${key}\`] = value
    })
    
    return vars
  })
  
  // 方法
  function setTheme(themeName) {
    if (themes[themeName]) {
      currentTheme.value = themeName
      saveToLocalStorage()
      applyTheme()
    }
  }
  
  function toggleTheme() {
    currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
    saveToLocalStorage()
    applyTheme()
  }
  
  function setCustomColor(property, color) {
    customColors.value[property] = color
    saveToLocalStorage()
    applyTheme()
  }
  
  function resetCustomColors() {
    customColors.value = {}
    saveToLocalStorage()
    applyTheme()
  }
  
  function detectSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      systemTheme.value = 'dark'
    } else {
      systemTheme.value = 'light'
    }
  }
  
  function useSystemTheme() {
    detectSystemTheme()
    currentTheme.value = systemTheme.value
    saveToLocalStorage()
    applyTheme()
  }
  
  // 应用主题到DOM
  function applyTheme() {
    // 设置主题类
    document.documentElement.setAttribute('data-theme', currentTheme.value)
    
    // 设置CSS变量
    Object.entries(cssVariables.value).forEach(([property, value]) => {
      document.documentElement.style.setProperty(property, value)
    })
    
    // 设置meta标签
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', mergedTheme.value.primary)
    }
  }
  
  // 本地存储
  function saveToLocalStorage() {
    localStorage.setItem('theme', JSON.stringify({
      currentTheme: currentTheme.value,
      customColors: customColors.value
    }))
  }
  
  function loadFromLocalStorage() {
    const savedTheme = localStorage.getItem('theme')
    
    if (savedTheme) {
      const theme = JSON.parse(savedTheme)
      currentTheme.value = theme.currentTheme || 'light'
      customColors.value = theme.customColors || {}
    } else {
      // 检测系统主题
      detectSystemTheme()
      currentTheme.value = systemTheme.value
    }
  }
  
  // 监听系统主题变化
  function watchSystemTheme() {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      
      mediaQuery.addEventListener('change', (e) => {
        systemTheme.value = e.matches ? 'dark' : 'light'
      })
    }
  }
  
  // 初始化
  loadFromLocalStorage()
  watchSystemTheme()
  applyTheme()
  
  return {
    // 状态
    currentTheme,
    systemTheme,
    customColors,
    themes,
    
    // 计算属性
    isDark,
    isLight,
    theme,
    mergedTheme,
    cssVariables,
    
    // 方法
    setTheme,
    toggleTheme,
    setCustomColor,
    resetCustomColors,
    useSystemTheme
  }
})
\`\`\`

### 通知状态管理

\`\`\`javascript
// stores/notifications.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useNotificationsStore = defineStore('notifications', () => {
  // 状态
  const notifications = ref([])
  const maxNotifications = ref(5)
  
  // 通知类型
  const notificationTypes = {
    success: {
      icon: 'check-circle',
      color: '#4caf50',
      duration: 3000
    },
    error: {
      icon: 'error',
      color: '#f44336',
      duration: 5000
    },
    warning: {
      icon: 'warning',
      color: '#ff9800',
      duration: 4000
    },
    info: {
      icon: 'info',
      color: '#2196f3',
      duration: 3000
    }
  }
  
  // 计算属性
  const hasNotifications = computed(() => notifications.value.length > 0)
  const notificationCount = computed(() => notifications.value.length)
  
  // 方法
  function addNotification(notification) {
    const id = Date.now() + Math.random()
    
    const newNotification = {
      id,
      title: notification.title || '',
      message: notification.message || '',
      type: notification.type || 'info',
      duration: notification.duration || notificationTypes[notification.type]?.duration || 3000,
      dismissible: notification.dismissible !== false,
      persistent: notification.persistent || false,
      actions: notification.actions || [],
      ...notificationTypes[notification.type]
    }
    
    // 如果超过最大通知数量，移除最旧的通知
    if (notifications.value.length >= maxNotifications.value) {
      notifications.value.shift()
    }
    
    notifications.value.push(newNotification)
    
    // 如果不是持久通知，设置自动移除
    if (!newNotification.persistent) {
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
  function success(title, message, options = {}) {
    return addNotification({
      title,
      message,
      type: 'success',
      ...options
    })
  }
  
  function error(title, message, options = {}) {
    return addNotification({
      title,
      message,
      type: 'error',
      ...options
    })
  }
  
  function warning(title, message, options = {}) {
    return addNotification({
      title,
      message,
      type: 'warning',
      ...options
    })
  }
  
  function info(title, message, options = {}) {
    return addNotification({
      title,
      message,
      type: 'info',
      ...options
    })
  }
  
  // 带操作的通知
  function confirm(title, message, onConfirm, onCancel, options = {}) {
    const id = addNotification({
      title,
      message,
      type: 'warning',
      persistent: true,
      actions: [
        {
          label: '确认',
          action: () => {
            onConfirm()
            removeNotification(id)
          },
          primary: true
        },
        {
          label: '取消',
          action: () => {
            if (onCancel) onCancel()
            removeNotification(id)
          }
        }
      ],
      ...options
    })
    
    return id
  }
  
  return {
    // 状态
    notifications,
    maxNotifications,
    notificationTypes,
    
    // 计算属性
    hasNotifications,
    notificationCount,
    
    // 方法
    addNotification,
    removeNotification,
    clearNotifications,
    success,
    error,
    warning,
    info,
    confirm
  }
})
\`\`\`

### 用户状态管理

\`\`\`javascript
// stores/user.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref(null)
  const token = ref('')
  const refreshToken = ref('')
  const permissions = ref([])
  const preferences = ref({
    language: 'zh-CN',
    timezone: 'Asia/Shanghai',
    emailNotifications: true,
    pushNotifications: false
  })
  
  // 计算属性
  const isLoggedIn = computed(() => !!token.value)
  const userName = computed(() => user.value?.name || '')
  const userEmail = computed(() => user.value?.email || '')
  const userAvatar = computed(() => user.value?.avatar || '')
  const userRole = computed(() => user.value?.role || 'guest')
  const hasPermission = computed(() => {
    return (permission) => permissions.value.includes(permission)
  })
  
  // 方法
  async function login(credentials) {
    try {
      // 模拟API调用
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })
      
      if (!response.ok) {
        throw new Error('登录失败')
      }
      
      const data = await response.json()
      
      user.value = data.user
      token.value = data.token
      refreshToken.value = data.refreshToken
      permissions.value = data.permissions || []
      
      // 保存到本地存储
      saveToLocalStorage()
      
      return data
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }
  
  async function register(userData) {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })
      
      if (!response.ok) {
        throw new Error('注册失败')
      }
      
      const data = await response.json()
      
      user.value = data.user
      token.value = data.token
      refreshToken.value = data.refreshToken
      permissions.value = data.permissions || []
      
      // 保存到本地存储
      saveToLocalStorage()
      
      return data
    } catch (error) {
      console.error('Register error:', error)
      throw error
    }
  }
  
  async function logout() {
    try {
      // 通知服务器令牌失效
      if (token.value) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': \`Bearer \${token.value}\`
          }
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // 无论服务器响应如何，都清除本地状态
      clearUserData()
    }
  }
  
  async function refreshAccessToken() {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refreshToken: refreshToken.value
        })
      })
      
      if (!response.ok) {
        throw new Error('令牌刷新失败')
      }
      
      const data = await response.json()
      token.value = data.token
      
      // 更新本地存储
      saveToLocalStorage()
      
      return data.token
    } catch (error) {
      console.error('Token refresh error:', error)
      // 刷新失败，清除用户数据
      clearUserData()
      throw error
    }
  }
  
  async function updateProfile(profileData) {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token.value}\`
        },
        body: JSON.stringify(profileData)
      })
      
      if (!response.ok) {
        throw new Error('更新个人资料失败')
      }
      
      const data = await response.json()
      user.value = { ...user.value, ...data.user }
      
      // 更新本地存储
      saveToLocalStorage()
      
      return data.user
    } catch (error) {
      console.error('Update profile error:', error)
      throw error
    }
  }
  
  async function changePassword(passwordData) {
    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token.value}\`
        },
        body: JSON.stringify(passwordData)
      })
      
      if (!response.ok) {
        throw new Error('修改密码失败')
      }
      
      return true
    } catch (error) {
      console.error('Change password error:', error)
      throw error
    }
  }
  
  function updatePreferences(newPreferences) {
    preferences.value = { ...preferences.value, ...newPreferences }
    saveToLocalStorage()
  }
  
  function clearUserData() {
    user.value = null
    token.value = ''
    refreshToken.value = ''
    permissions.value = []
    
    // 清除本地存储
    localStorage.removeItem('user')
  }
  
  // 本地存储
  function saveToLocalStorage() {
    localStorage.setItem('user', JSON.stringify({
      user: user.value,
      token: token.value,
      refreshToken: refreshToken.value,
      permissions: permissions.value,
      preferences: preferences.value
    }))
  }
  
  function loadFromLocalStorage() {
    const savedUser = localStorage.getItem('user')
    
    if (savedUser) {
      const userData = JSON.parse(savedUser)
      user.value = userData.user || null
      token.value = userData.token || ''
      refreshToken.value = userData.refreshToken || ''
      permissions.value = userData.permissions || []
      preferences.value = userData.preferences || {
        language: 'zh-CN',
        timezone: 'Asia/Shanghai',
        emailNotifications: true,
        pushNotifications: false
      }
    }
  }
  
  // 初始化时加载本地存储
  loadFromLocalStorage()
  
  return {
    // 状态
    user,
    token,
    refreshToken,
    permissions,
    preferences,
    
    // 计算属性
    isLoggedIn,
    userName,
    userEmail,
    userAvatar,
    userRole,
    hasPermission,
    
    // 方法
    login,
    register,
    logout,
    refreshAccessToken,
    updateProfile,
    changePassword,
    updatePreferences,
    clearUserData
  }
})
\`\`\`

## 状态管理最佳实践

### 状态结构设计

良好的状态结构设计是可维护状态管理的基础。

\`\`\`javascript
// 好的状态结构设计示例
export const useProductStore = defineStore('product', () => {
  // 状态分类清晰
  const entities = ref({}) // 以ID为键的实体
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
    priceRange: null,
    search: ''
  })
  
  // 计算属性
  const products = computed(() => 
    ids.value.map(id => entities.value[id]).filter(Boolean)
  )
  
  const hasProducts = computed(() => ids.value.length > 0)
  const isEmpty = computed(() => ids.value.length === 0)
  const filteredProducts = computed(() => {
    let result = products.value
    
    if (filters.value.category) {
      result = result.filter(p => p.category === filters.value.category)
    }
    
    if (filters.value.priceRange) {
      const [min, max] = filters.value.priceRange
      result = result.filter(p => p.price >= min && p.price <= max)
    }
    
    if (filters.value.search) {
      const searchLower = filters.value.search.toLowerCase()
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      )
    }
    
    return result
  })
  
  // 方法
  async function fetchProducts() {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch('/api/products', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('获取产品列表失败')
      }
      
      const data = await response.json()
      
      // 更新实体
      data.products.forEach(product => {
        entities.value[product.id] = product
      })
      
      // 更新ID列表
      ids.value = data.products.map(p => p.id)
      
      // 更新分页信息
      pagination.value = {
        ...pagination.value,
        total: data.total
      }
    } catch (err) {
      error.value = err.message
      console.error('Fetch products error:', err)
    } finally {
      loading.value = false
    }
  }
  
  async function fetchProduct(id) {
    if (entities.value[id]) {
      return entities.value[id]
    }
    
    try {
      const response = await fetch(\`/api/products/\${id}\`)
      
      if (!response.ok) {
        throw new Error('获取产品详情失败')
      }
      
      const product = await response.json()
      
      // 更新实体
      entities.value[product.id] = product
      
      // 如果不在列表中，添加到列表
      if (!ids.value.includes(product.id)) {
        ids.value.push(product.id)
      }
      
      return product
    } catch (err) {
      error.value = err.message
      console.error('Fetch product error:', err)
      throw err
    }
  }
  
  function setFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters }
  }
  
  function clearFilters() {
    filters.value = {
      category: null,
      priceRange: null,
      search: ''
    }
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
    isEmpty,
    filteredProducts,
    
    // 方法
    fetchProducts,
    fetchProduct,
    setFilters,
    clearFilters,
    setPage
  }
})
\`\`\`

### 异步操作处理

正确处理异步操作是状态管理的关键部分。

\`\`\`javascript
// 异步操作处理最佳实践
export const useAsyncStore = defineStore('async', () => {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)
  
  // 基本异步操作
  async function fetchData(url) {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`)
      }
      
      data.value = await response.json()
      return data.value
    } catch (err) {
      error.value = err.message
      console.error('Fetch data error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // 带重试机制的异步操作
  async function fetchWithRetry(url, maxRetries = 3, delay = 1000) {
    let lastError
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fetchData(url)
      } catch (err) {
        lastError = err
        
        if (i < maxRetries - 1) {
          console.warn(\`Retry \${i + 1}/\${maxRetries} after \${delay}ms\`)
          await new Promise(resolve => setTimeout(resolve, delay))
          delay *= 2 // 指数退避
        }
      }
    }
    
    throw lastError
  }
  
  // 带取消功能的异步操作
  let abortController = null
  
  async function fetchWithCancel(url) {
    // 取消之前的请求
    if (abortController) {
      abortController.abort()
    }
    
    abortController = new AbortController()
    
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(url, {
        signal: abortController.signal
      })
      
      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`)
      }
      
      data.value = await response.json()
      return data.value
    } catch (err) {
      // 如果是取消操作，不设置错误
      if (err.name !== 'AbortError') {
        error.value = err.message
        console.error('Fetch data error:', err)
        throw err
      }
    } finally {
      loading.value = false
    }
  }
  
  function cancelRequest() {
    if (abortController) {
      abortController.abort()
    }
  }
  
  return {
    data,
    loading,
    error,
    fetchData,
    fetchWithRetry,
    fetchWithCancel,
    cancelRequest
  }
})
\`\`\`

### 模块化与组合

通过模块化和组合实现复杂的状态管理。

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
    
    // 通用异步操作包装器
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

// stores/crud.js - CRUD操作
export function createCrudStore(id, resourceUrl, options = {}) {
  const baseStore = createBaseStore(id, options)
  
  return defineStore(id, () => {
    // 使用基础store
    const { loading, error, isLoading, hasError, errorMessage, setLoading, setError, clearError, withLoading } = baseStore()
    
    // 资源状态
    const items = ref([])
    const item = ref(null)
    const pagination = ref({
      page: 1,
      limit: 20,
      total: 0
    })
    
    // 计算属性
    const hasItems = computed(() => items.value.length > 0)
    const isEmpty = computed(() => items.value.length === 0)
    
    // CRUD方法
    async function fetchItems(params = {}) {
      return withLoading(
        fetch(\`\${resourceUrl}?\${new URLSearchParams(params)}\`)
          .then(response => {
            if (!response.ok) {
              throw new Error(\`HTTP error! status: \${response.status}\`)
            }
            return response.json()
          })
          .then(data => {
            items.value = data.items
            pagination.value = data.pagination
            return data
          })
      )
    }
    
    async function fetchItem(id) {
      return withLoading(
        fetch(\`\${resourceUrl}/\${id}\`)
          .then(response => {
            if (!response.ok) {
              throw new Error(\`HTTP error! status: \${response.status}\`)
            }
            return response.json()
          })
          .then(data => {
            item.value = data
            return data
          })
      )
    }
    
    async function createItem(newItem) {
      return withLoading(
        fetch(resourceUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newItem)
        })
          .then(response => {
            if (!response.ok) {
              throw new Error(\`HTTP error! status: \${response.status}\`)
            }
            return response.json()
          })
          .then(data => {
            items.value.push(data)
            return data
          })
      )
    }
    
    async function updateItem(id, updatedItem) {
      return withLoading(
        fetch(\`\${resourceUrl}/\${id}\`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedItem)
        })
          .then(response => {
            if (!response.ok) {
              throw new Error(\`HTTP error! status: \${response.status}\`)
            }
            return response.json()
          })
          .then(data => {
            const index = items.value.findIndex(item => item.id === id)
            if (index !== -1) {
              items.value[index] = data
            }
            if (item.value && item.value.id === id) {
              item.value = data
            }
            return data
          })
      )
    }
    
    async function deleteItem(id) {
      return withLoading(
        fetch(\`\${resourceUrl}/\${id}\`, {
          method: 'DELETE'
        })
          .then(response => {
            if (!response.ok) {
              throw new Error(\`HTTP error! status: \${response.status}\`)
            }
            return response.json()
          })
          .then(() => {
            items.value = items.value.filter(item => item.id !== id)
            if (item.value && item.value.id === id) {
              item.value = null
            }
          })
      )
    }
    
    return {
      // 状态
      items,
      item,
      pagination,
      loading,
      error,
      
      // 计算属性
      isLoading,
      hasError,
      errorMessage,
      hasItems,
      isEmpty,
      
      // 方法
      fetchItems,
      fetchItem,
      createItem,
      updateItem,
      deleteItem
    }
  })
}

// 使用示例
export const useUserStore = createCrudStore('users', '/api/users')
export const useProductStore = createCrudStore('products', '/api/products')
\`\`\`

## 总结

Pinia作为Vue的新一代状态管理库，提供了简洁、直观且功能强大的API，使状态管理变得更加容易和高效。

### Pinia的优势

1. **简洁的API**：减少了模板代码，提供了更直观的开发体验
2. **优秀的TypeScript支持**：无需额外配置即可获得完整的类型推断
3. **模块化设计**：每个store都是独立的，天然支持模块化
4. **灵活的状态更新**：支持直接修改状态，无需mutation
5. **强大的插件系统**：可以轻松扩展store的功能
6. **出色的开发体验**：提供了更好的调试支持和错误处理

### 实际开发建议

1. **合理设计状态结构**：使用实体-ID模式，避免数据冗余
2. **正确处理异步操作**：使用loading和error状态，提供良好的用户体验
3. **模块化和组合**：创建可复用的store逻辑，提高代码复用性
4. **利用TypeScript**：定义清晰的接口，提高代码可维护性
5. **持久化关键状态**：使用localStorage或sessionStorage保存重要状态
6. **合理使用插件**：根据需要创建自定义插件，扩展store功能

通过合理使用Pinia，我们可以构建出状态管理清晰、代码可维护性高、用户体验良好的Vue应用程序。`;export{n as default};
//# sourceMappingURL=15-3-DYnzQApH.js.map
