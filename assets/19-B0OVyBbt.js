const n=`---
title: "React状态管理与Redux深度解析"
excerpt: "深入探讨React状态管理的各种方案，重点解析Redux的核心概念、工作原理以及最佳实践，帮助开发者构建可维护、可扩展的React应用"
coverImage: "/assets/blog/hello-world/cover.jpg"
date: "2025-10-22"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/hello-world/cover.jpg"
---

# React状态管理与Redux深度解析

## 前言

在React应用中，状态管理是一个核心且复杂的主题。随着应用规模的扩大，组件间的状态共享和通信变得越来越重要。Redux作为React生态系统中最流行的状态管理库，提供了一种可预测的状态管理方案。本文将深入探讨React状态管理的各种方案，重点解析Redux的核心概念、工作原理以及最佳实践，帮助你构建可维护、可扩展的React应用。

## React状态管理基础

### 组件级状态

组件级状态是最基本的状态管理方式，使用React的useState Hook管理组件内部状态：

\`\`\`jsx
import React, { useState } from 'react'

function Counter() {
  // 组件内部状态
  const [count, setCount] = useState(0)
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
    </div>
  )
}

// 复杂组件状态
function UserProfile() {
  const [user, setUser] = useState({
    name: '',
    email: '',
    age: 0
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const handleChange = (field, value) => {
    setUser(prevUser => ({
      ...prevUser,
      [field]: value
    }))
  }
  
  return (
    <div>
      <input
        value={user.name}
        onChange={e => handleChange('name', e.target.value)}
        placeholder="Name"
      />
      <input
        value={user.email}
        onChange={e => handleChange('email', e.target.value)}
        placeholder="Email"
      />
      <input
        type="number"
        value={user.age}
        onChange={e => handleChange('age', parseInt(e.target.value))}
        placeholder="Age"
      />
    </div>
  )
}
\`\`\`

### 组件间状态共享

当多个组件需要共享状态时，可以使用以下几种方式：

#### 1. 状态提升

将状态提升到最近的共同父组件中：

\`\`\`jsx
// 状态提升示例
function ParentComponent() {
  const [count, setCount] = useState(0)
  
  return (
    <div>
      <ChildA count={count} onIncrement={() => setCount(count + 1)} />
      <ChildB count={count} onDecrement={() => setCount(count - 1)} />
    </div>
  )
}

function ChildA({ count, onIncrement }) {
  return (
    <div>
      <p>Child A: {count}</p>
      <button onClick={onIncrement}>Increment</button>
    </div>
  )
}

function ChildB({ count, onDecrement }) {
  return (
    <div>
      <p>Child B: {count}</p>
      <button onClick={onDecrement}>Decrement</button>
    </div>
  )
}
\`\`\`

#### 2. Context API

使用React Context API跨组件层级共享状态：

\`\`\`jsx
import React, { createContext, useContext, useState } from 'react'

// 创建Context
const CountContext = createContext()

// Context Provider组件
function CountProvider({ children }) {
  const [count, setCount] = useState(0)
  
  const increment = () => setCount(prevCount => prevCount + 1)
  const decrement = () => setCount(prevCount => prevCount - 1)
  
  const value = {
    count,
    increment,
    decrement
  }
  
  return (
    <CountContext.Provider value={value}>
      {children}
    </CountContext.Provider>
  )
}

// 自定义Hook使用Context
function useCount() {
  const context = useContext(CountContext)
  if (!context) {
    throw new Error('useCount must be used within a CountProvider')
  }
  return context
}

// 使用Context的组件
function ComponentA() {
  const { count, increment } = useCount()
  
  return (
    <div>
      <p>Component A: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  )
}

function ComponentB() {
  const { count, decrement } = useCount()
  
  return (
    <div>
      <p>Component B: {count}</p>
      <button onClick={decrement}>Decrement</button>
    </div>
  )
}

// 应用组件
function App() {
  return (
    <CountProvider>
      <ComponentA />
      <ComponentB />
    </CountProvider>
  )
}
\`\`\`

#### 3. 组合模式

使用组合模式共享状态：

\`\`\`jsx
function App() {
  const [user, setUser] = useState({ name: 'John', age: 30 })
  
  return (
    <div>
      <Header user={user} />
      <Main>
        <UserProfile user={user} onChange={setUser} />
        <UserStats user={user} />
      </Main>
      <Footer user={user} />
    </div>
  )
}

function Header({ user }) {
  return <header>Welcome, {user.name}</header>
}

function Main({ children }) {
  return <main>{children}</main>
}

function UserProfile({ user, onChange }) {
  const handleChange = (field, value) => {
    onChange(prevUser => ({
      ...prevUser,
      [field]: value
    }))
  }
  
  return (
    <div>
      <input
        value={user.name}
        onChange={e => handleChange('name', e.target.value)}
      />
      <input
        type="number"
        value={user.age}
        onChange={e => handleChange('age', parseInt(e.target.value))}
      />
    </div>
  )
}

function UserStats({ user }) {
  return <div>User age: {user.age}</div>
}

function Footer({ user }) {
  return <footer>Logged in as {user.name}</footer>
}
\`\`\`

## Redux基础概念

### Redux核心原则

Redux遵循三个核心原则：

1. **单一数据源（Single Source of Truth）**：整个应用的状态存储在一个对象树中
2. **状态是只读的（State is Read-Only）**：唯一改变状态的方式是触发action
3. **使用纯函数执行修改（Changes are Made with Pure Functions）**：使用reducers描述action如何改变状态

\`\`\`javascript
// Redux状态示例
const initialState = {
  user: {
    name: 'John',
    email: 'john@example.com',
    age: 30
  },
  posts: [
    { id: 1, title: 'Post 1', content: 'Content 1' },
    { id: 2, title: 'Post 2', content: 'Content 2' }
  ],
  loading: false,
  error: null
}
\`\`\`

### Action

Action是描述发生了什么的普通对象：

\`\`\`javascript
// Action示例
const addUserAction = {
  type: 'ADD_USER',
  payload: {
    id: 1,
    name: 'Jane',
    email: 'jane@example.com'
  }
}

// Action创建函数
function addUser(user) {
  return {
    type: 'ADD_USER',
    payload: user
  }
}

// 异步Action创建函数（使用Redux Thunk）
function fetchUser(userId) {
  return async (dispatch, getState) => {
    dispatch({ type: 'FETCH_USER_REQUEST' })
    
    try {
      const response = await fetch(\`/api/users/\${userId}\`)
      const user = await response.json()
      
      dispatch({
        type: 'FETCH_USER_SUCCESS',
        payload: user
      })
    } catch (error) {
      dispatch({
        type: 'FETCH_USER_FAILURE',
        payload: error.message
      })
    }
  }
}
\`\`\`

### Reducer

Reducer是纯函数，指定应用状态如何响应action：

\`\`\`javascript
// Reducer示例
const initialState = {
  users: [],
  loading: false,
  error: null
}

function userReducer(state = initialState, action) {
  switch (action.type) {
    case 'FETCH_USERS_REQUEST':
      return {
        ...state,
        loading: true,
        error: null
      }
    
    case 'FETCH_USERS_SUCCESS':
      return {
        ...state,
        loading: false,
        users: action.payload
      }
    
    case 'FETCH_USERS_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload
      }
    
    case 'ADD_USER':
      return {
        ...state,
        users: [...state.users, action.payload]
      }
    
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(user =>
          user.id === action.payload.id
            ? { ...user, ...action.payload }
            : user
        )
      }
    
    case 'DELETE_USER':
      return {
        ...state,
        users: state.users.filter(user => user.id !== action.payload)
      }
    
    default:
      return state
  }
}
\`\`\`

### Store

Store是保存应用状态的对象：

\`\`\`javascript
import { createStore, applyMiddleware, combineReducers } from 'redux'
import thunk from 'redux-thunk'
import logger from 'redux-logger'

// 合并多个reducer
const rootReducer = combineReducers({
  users: userReducer,
  posts: postReducer,
  auth: authReducer
})

// 创建store，应用中间件
const store = createStore(
  rootReducer,
  applyMiddleware(thunk, logger)
)

// 获取状态
console.log(store.getState())

// 订阅状态变化
const unsubscribe = store.subscribe(() => {
  console.log('State updated:', store.getState())
})

// 派发action
store.dispatch(addUser({ id: 1, name: 'John' }))

// 取消订阅
unsubscribe()
\`\`\`

## Redux与React集成

### React-Redux基础

react-redux库提供了Redux与React的集成：

\`\`\`jsx
import React from 'react'
import { Provider, useSelector, useDispatch } from 'react-redux'
import { createStore } from 'redux'
import rootReducer from './reducers'

// 创建store
const store = createStore(rootReducer)

// Provider组件提供store给应用
function App() {
  return (
    <Provider store={store}>
      <UserList />
    </Provider>
  )
}

// 使用useSelector获取状态
function UserList() {
  const users = useSelector(state => state.users.users)
  const loading = useSelector(state => state.users.loading)
  const error = useSelector(state => state.users.error)
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  
  return (
    <div>
      <h2>Users</h2>
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
      <AddUserForm />
    </div>
  )
}

// 使用useDispatch派发action
function AddUserForm() {
  const [name, setName] = React.useState('')
  const dispatch = useDispatch()
  
  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.trim()) {
      dispatch({
        type: 'ADD_USER',
        payload: { id: Date.now(), name }
      })
      setName('')
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="User name"
      />
      <button type="submit">Add User</button>
    </form>
  )
}
\`\`\`

### connect高阶组件

除了Hooks，react-redux还提供了connect高阶组件：

\`\`\`jsx
import React from 'react'
import { connect } from 'react-redux'

class UserList extends React.Component {
  render() {
    const { users, loading, error, addUser } = this.props
    
    if (loading) return <div>Loading...</div>
    if (error) return <div>Error: {error}</div>
    
    return (
      <div>
        <h2>Users</h2>
        <ul>
          {users.map(user => (
            <li key={user.id}>{user.name}</li>
          ))}
        </ul>
        <AddUserForm addUser={addUser} />
      </div>
    )
  }
}

// mapStateToProps函数将state映射到props
const mapStateToProps = (state) => ({
  users: state.users.users,
  loading: state.users.loading,
  error: state.users.error
})

// mapDispatchToProps函数将dispatch映射到props
const mapDispatchToProps = (dispatch) => ({
  addUser: (user) => dispatch({ type: 'ADD_USER', payload: user })
})

// 使用connect连接组件和Redux store
export default connect(mapStateToProps, mapDispatchToProps)(UserList)
\`\`\`

## Redux中间件

### 中间件概念

中间件是Redux中用于扩展dispatch功能的机制：

\`\`\`javascript
// 简单的中间件示例
const loggerMiddleware = store => next => action => {
  console.log('Dispatching:', action)
  const result = next(action)
  console.log('Next state:', store.getState())
  return result
}

// 应用中间件
import { createStore, applyMiddleware } from 'redux'
const store = createStore(rootReducer, applyMiddleware(loggerMiddleware))
\`\`\`

### 常用中间件

#### 1. Redux Thunk

Redux Thunk允许action创建函数返回函数而不是action对象：

\`\`\`javascript
import thunk from 'redux-thunk'

// 异步action创建函数
function fetchUsers() {
  return async (dispatch, getState) => {
    dispatch({ type: 'FETCH_USERS_REQUEST' })
    
    try {
      const response = await fetch('/api/users')
      const users = await response.json()
      
      dispatch({
        type: 'FETCH_USERS_SUCCESS',
        payload: users
      })
    } catch (error) {
      dispatch({
        type: 'FETCH_USERS_FAILURE',
        payload: error.message
      })
    }
  }
}

// 在组件中使用
function UserList() {
  const dispatch = useDispatch()
  const users = useSelector(state => state.users.users)
  
  React.useEffect(() => {
    dispatch(fetchUsers())
  }, [dispatch])
  
  return (
    <div>
      {users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  )
}

// 应用thunk中间件
const store = createStore(rootReducer, applyMiddleware(thunk))
\`\`\`

#### 2. Redux Saga

Redux Saga使用ES6的Generator函数处理异步操作：

\`\`\`javascript
import { takeEvery, put, call } from 'redux-saga/effects'
import createSagaMiddleware from 'redux-saga'

// API调用函数
function fetchUsersApi() {
  return fetch('/api/users').then(response => response.json())
}

// Saga Generator函数
function* fetchUsersSaga() {
  try {
    const users = yield call(fetchUsersApi)
    yield put({ type: 'FETCH_USERS_SUCCESS', payload: users })
  } catch (error) {
    yield put({ type: 'FETCH_USERS_FAILURE', payload: error.message })
  }
}

// 监听action的Saga
function* watchFetchUsers() {
  yield takeEvery('FETCH_USERS_REQUEST', fetchUsersSaga)
}

// 创建saga中间件
const sagaMiddleware = createSagaMiddleware()

// 应用saga中间件
const store = createStore(rootReducer, applyMiddleware(sagaMiddleware))

// 运行saga
sagaMiddleware.run(watchFetchUsers)
\`\`\`

#### 3. 自定义中间件

\`\`\`javascript
// 错误处理中间件
const errorMiddleware = store => next => action => {
  try {
    return next(action)
  } catch (error) {
    console.error('Caught an exception!', error)
    
    // 可以派发错误action
    store.dispatch({
      type: 'ERROR_OCCURRED',
      payload: error
    })
    
    throw error
  }
}

// 分析中间件
const analyticsMiddleware = store => next => action => {
  // 记录action
  analytics.track('action_dispatched', {
    type: action.type,
    payload: action.payload
  })
  
  // 继续处理action
  return next(action)
}

// 应用多个中间件
const store = createStore(
  rootReducer,
  applyMiddleware(thunk, errorMiddleware, analyticsMiddleware)
)
\`\`\`

## Redux最佳实践

### 1. 状态结构设计

设计良好的状态结构是Redux应用的基础：

\`\`\`javascript
// 好的状态结构设计
const goodStateStructure = {
  entities: {
    users: {
      byId: {
        1: { id: 1, name: 'John', email: 'john@example.com' },
        2: { id: 2, name: 'Jane', email: 'jane@example.com' }
      },
      allIds: [1, 2]
    },
    posts: {
      byId: {
        101: { id: 101, title: 'Post 1', authorId: 1 },
        102: { id: 102, title: 'Post 2', authorId: 2 }
      },
      allIds: [101, 102]
    }
  },
  ui: {
    users: {
      isLoading: false,
      error: null,
      selectedUserId: null
    },
    posts: {
      isLoading: false,
      error: null,
      selectedPostId: null
    }
  },
  auth: {
    isAuthenticated: false,
    user: null,
    token: null
  }
}

// 不好的状态结构设计
const badStateStructure = {
  users: [
    { id: 1, name: 'John', email: 'john@example.com' },
    { id: 2, name: 'Jane', email: 'jane@example.com' }
  ],
  posts: [
    { id: 101, title: 'Post 1', author: { id: 1, name: 'John' } },
    { id: 102, title: 'Post 2', author: { id: 2, name: 'Jane' } }
  ],
  loading: false,
  error: null,
  selectedUser: null,
  selectedPost: null
}
\`\`\`

### 2. Action设计原则

\`\`\`javascript
// 使用Flux标准Action格式
const fetchUsersRequest = {
  type: 'FETCH_USERS_REQUEST',
  meta: { timestamp: Date.now() }
}

const fetchUsersSuccess = {
  type: 'FETCH_USERS_SUCCESS',
  payload: {
    users: [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' }
    ]
  },
  meta: { timestamp: Date.now() }
}

const fetchUsersFailure = {
  type: 'FETCH_USERS_FAILURE',
  error: true,
  payload: {
    message: 'Network error'
  },
  meta: { timestamp: Date.now() }
}

// 使用action创建函数
const userActions = {
  fetchUsersRequest: () => ({
    type: 'FETCH_USERS_REQUEST',
    meta: { timestamp: Date.now() }
  }),
  
  fetchUsersSuccess: (users) => ({
    type: 'FETCH_USERS_SUCCESS',
    payload: { users },
    meta: { timestamp: Date.now() }
  }),
  
  fetchUsersFailure: (error) => ({
    type: 'FETCH_USERS_FAILURE',
    error: true,
    payload: { message: error },
    meta: { timestamp: Date.now() }
  }),
  
  addUser: (user) => ({
    type: 'ADD_USER',
    payload: { user }
  }),
  
  updateUser: (id, updates) => ({
    type: 'UPDATE_USER',
    payload: { id, updates }
  }),
  
  deleteUser: (id) => ({
    type: 'DELETE_USER',
    payload: { id }
  })
}
\`\`\`

### 3. Reducer设计原则

\`\`\`javascript
// 使用switch语句处理action类型
function usersReducer(state = initialState, action) {
  switch (action.type) {
    case 'FETCH_USERS_REQUEST':
      return {
        ...state,
        isLoading: true,
        error: null
      }
    
    case 'FETCH_USERS_SUCCESS':
      return {
        ...state,
        isLoading: false,
        entities: normalizeUsers(action.payload.users),
        allIds: action.payload.users.map(user => user.id)
      }
    
    case 'FETCH_USERS_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload.message
      }
    
    case 'ADD_USER':
      return {
        ...state,
        entities: {
          ...state.entities,
          [action.payload.user.id]: action.payload.user
        },
        allIds: [...state.allIds, action.payload.user.id]
      }
    
    case 'UPDATE_USER':
      return {
        ...state,
        entities: {
          ...state.entities,
          [action.payload.id]: {
            ...state.entities[action.payload.id],
            ...action.payload.updates
          }
        }
      }
    
    case 'DELETE_USER':
      const { [action.payload.id]: removedUser, ...remainingEntities } = state.entities
      return {
        ...state,
        entities: remainingEntities,
        allIds: state.allIds.filter(id => id !== action.payload.id)
      }
    
    default:
      return state
  }
}

// 使用辅助函数简化reducer
function updateObject(oldObject, newValues) {
  return { ...oldObject, ...newValues }
}

function createReducer(initialState, handlers) {
  return function reducer(state = initialState, action) {
    if (handlers.hasOwnProperty(action.type)) {
      return handlers[action.type](state, action)
    } else {
      return state
    }
  }
}

// 使用createReducer创建reducer
const usersReducer = createReducer(initialState, {
  [FETCH_USERS_REQUEST]: (state, action) => ({
    ...state,
    isLoading: true,
    error: null
  }),
  
  [FETCH_USERS_SUCCESS]: (state, action) => ({
    ...state,
    isLoading: false,
    entities: normalizeUsers(action.payload.users),
    allIds: action.payload.users.map(user => user.id)
  }),
  
  [FETCH_USERS_FAILURE]: (state, action) => ({
    ...state,
    isLoading: false,
    error: action.payload.message
  })
})
\`\`\`

### 4. 选择器模式

使用选择器模式封装状态访问逻辑：

\`\`\`javascript
// 基础选择器
export const getUsers = state => state.users.entities
export const getUserIds = state => state.users.allIds
export const getUsersLoading = state => state.users.isLoading
export const getUsersError = state => state.users.error

// 记忆化选择器
import { createSelector } from 'reselect'

export const getAllUsers = createSelector(
  [getUsers, getUserIds],
  (users, ids) => ids.map(id => users[id])
)

export const getUserById = createSelector(
  [getUsers, (state, userId) => userId],
  (users, userId) => users[userId]
)

export const getUsersByRole = createSelector(
  [getAllUsers, (state, role) => role],
  (users, role) => users.filter(user => user.role === role)
)

// 复杂选择器
export const getUsersWithPosts = createSelector(
  [getAllUsers, getAllPosts],
  (users, posts) => users.map(user => ({
    ...user,
    posts: posts.filter(post => post.authorId === user.id)
  }))
)

// 在组件中使用选择器
function UserList() {
  const users = useSelector(getAllUsers)
  const loading = useSelector(getUsersLoading)
  const error = useSelector(getUsersError)
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  
  return (
    <div>
      {users.map(user => (
        <UserItem key={user.id} user={user} />
      ))}
    </div>
  )
}
\`\`\`

## Redux Toolkit

### Redux Toolkit简介

Redux Toolkit（RTK）是官方推荐的Redux开发工具集，简化了Redux开发：

\`\`\`javascript
import { createSlice, configureStore } from '@reduxjs/toolkit'

// 使用createSlice创建reducer和action
const counterSlice = createSlice({
  name: 'counter',
  initialState: {
    value: 0,
    status: 'idle'
  },
  reducers: {
    increment: state => {
      state.value += 1
    },
    decrement: state => {
      state.value -= 1
    },
    incrementByAmount: (state, action) => {
      state.value += action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.user = action.payload
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
      })
  }
})

// 导出action创建函数
export const { increment, decrement, incrementByAmount } = counterSlice.actions

// 导出reducer
export default counterSlice.reducer

// 创建异步thunk
import { createAsyncThunk } from '@reduxjs/toolkit'

export const fetchUser = createAsyncThunk('users/fetchUser', async (userId) => {
  const response = await fetch(\`/api/users/\${userId}\`)
  const data = await response.json()
  return data
})

// 配置store
const store = configureStore({
  reducer: {
    counter: counterSlice.reducer,
    users: usersSlice.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST']
      }
    })
})
\`\`\`

### RTK Query

RTK Query是Redux Toolkit内置的数据获取和缓存解决方案：

\`\`\`javascript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// 创建API切片
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token
      if (token) {
        headers.set('authorization', \`Bearer \${token}\`)
      }
      return headers
    }
  }),
  tagTypes: ['User', 'Post'],
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => 'users',
      providesTags: ['User']
    }),
    getUserById: builder.query({
      query: (id) => \`users/\${id}\`,
      providesTags: (result, error, id) => [{ type: 'User', id }]
    }),
    createUser: builder.mutation({
      query: (user) => ({
        url: 'users',
        method: 'POST',
        body: user
      }),
      invalidatesTags: ['User']
    }),
    updateUser: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: \`users/\${id}\`,
        method: 'PATCH',
        body: patch
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'User', id }]
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        url: \`users/\${id}\`,
        method: 'DELETE'
      }),
      invalidatesTags: ['User']
    })
  })
})

// 导出自动生成的hooks
export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation
} = apiSlice

// 在组件中使用
function UserList() {
  const { data: users, error, isLoading } = useGetUsersQuery()
  const [deleteUser] = useDeleteUserMutation()
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <div>
      {users.map(user => (
        <div key={user.id}>
          <span>{user.name}</span>
          <button onClick={() => deleteUser(user.id)}>Delete</button>
        </div>
      ))}
    </div>
  )
}
\`\`\`

## 实际应用案例

### 1. 电商购物车状态管理

\`\`\`javascript
// 购物车slice
import { createSlice } from '@reduxjs/toolkit'

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: {},
    totalItems: 0,
    totalPrice: 0,
    checkoutStatus: 'idle' // 'idle', 'loading', 'success', 'error'
  },
  reducers: {
    addToCart: (state, action) => {
      const { id, name, price } = action.payload
      if (state.items[id]) {
        state.items[id].quantity += 1
      } else {
        state.items[id] = { id, name, price, quantity: 1 }
      }
      
      // 重新计算总价
      cartSlice.caseReducers.calculateTotals(state)
    },
    
    removeFromCart: (state, action) => {
      const id = action.payload
      delete state.items[id]
      cartSlice.caseReducers.calculateTotals(state)
    },
    
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload
      if (quantity <= 0) {
        delete state.items[id]
      } else {
        state.items[id].quantity = quantity
      }
      cartSlice.caseReducers.calculateTotals(state)
    },
    
    calculateTotals: (state) => {
      let totalItems = 0
      let totalPrice = 0
      
      Object.values(state.items).forEach(item => {
        totalItems += item.quantity
        totalPrice += item.price * item.quantity
      })
      
      state.totalItems = totalItems
      state.totalPrice = totalPrice
    },
    
    clearCart: (state) => {
      state.items = {}
      state.totalItems = 0
      state.totalPrice = 0
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkout.pending, (state) => {
        state.checkoutStatus = 'loading'
      })
      .addCase(checkout.fulfilled, (state) => {
        state.checkoutStatus = 'success'
        cartSlice.caseReducers.clearCart(state)
      })
      .addCase(checkout.rejected, (state) => {
        state.checkoutStatus = 'error'
      })
  }
})

export const { addToCart, removeFromCart, updateQuantity } = cartSlice.actions
export default cartSlice.reducer

// 异步action
export const checkout = createAsyncThunk(
  'cart/checkout',
  async (cartItems, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items: Object.values(cartItems) })
      })
      
      if (!response.ok) {
        throw new Error('Checkout failed')
      }
      
      return await response.json()
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// 购物车组件
function Cart() {
  const items = useSelector(state => state.cart.items)
  const totalItems = useSelector(state => state.cart.totalItems)
  const totalPrice = useSelector(state => state.cart.totalPrice)
  const checkoutStatus = useSelector(state => state.cart.checkoutStatus)
  const dispatch = useDispatch()
  
  const handleCheckout = () => {
    dispatch(checkout(items))
  }
  
  return (
    <div>
      <h2>Shopping Cart</h2>
      
      {Object.values(items).length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <>
          <ul>
            {Object.values(items).map(item => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={(id, quantity) => dispatch(updateQuantity({ id, quantity }))}
                onRemove={(id) => dispatch(removeFromCart(id))}
              />
            ))}
          </ul>
          
          <div className="cart-summary">
            <p>Total Items: {totalItems}</p>
            <p>Total Price: \${totalPrice.toFixed(2)}</p>
            
            <button
              onClick={handleCheckout}
              disabled={checkoutStatus === 'loading'}
            >
              {checkoutStatus === 'loading' ? 'Processing...' : 'Checkout'}
            </button>
            
            {checkoutStatus === 'success' && (
              <div className="success-message">Order placed successfully!</div>
            )}
            
            {checkoutStatus === 'error' && (
              <div className="error-message">Checkout failed. Please try again.</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
\`\`\`

### 2. 实时通知系统

\`\`\`javascript
// 通知slice
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    nextId: 1
  },
  reducers: {
    addNotification: (state, action) => {
      const { type, message, duration = 5000 } = action.payload
      
      state.items.push({
        id: state.nextId,
        type,
        message,
        timestamp: Date.now(),
        duration
      })
      
      state.nextId += 1
    },
    
    removeNotification: (state, action) => {
      const id = action.payload
      state.items = state.items.filter(item => item.id !== id)
    },
    
    clearAllNotifications: (state) => {
      state.items = []
    }
  }
})

export const { addNotification, removeNotification } = notificationsSlice.actions

// WebSocket中间件
const websocketMiddleware = store => next => action => {
  if (action.type === 'websocket/connect') {
    const { url } = action.payload
    
    const websocket = new WebSocket(url)
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      // 根据消息类型派发不同的action
      switch (data.type) {
        case 'notification':
          store.dispatch(addNotification({
            type: data.level, // 'info', 'success', 'warning', 'error'
            message: data.message
          }))
          break
          
        case 'user_update':
          store.dispatch({
            type: 'users/updateUser',
            payload: data.user
          })
          break
          
        default:
          console.log('Unknown message type:', data.type)
      }
    }
    
    websocket.onclose = () => {
      store.dispatch({ type: 'websocket/disconnected' })
    }
    
    // 将websocket实例存储在store中
    store.websocket = websocket
  }
  
  if (action.type === 'websocket/disconnect') {
    if (store.websocket) {
      store.websocket.close()
      store.websocket = null
    }
  }
  
  if (action.type === 'websocket/send') {
    if (store.websocket && store.websocket.readyState === WebSocket.OPEN) {
      store.websocket.send(JSON.stringify(action.payload))
    }
  }
  
  return next(action)
}

// 通知组件
function NotificationCenter() {
  const notifications = useSelector(state => state.notifications.items)
  const dispatch = useDispatch()
  
  // 自动移除通知
  useEffect(() => {
    const timers = notifications.map(notification => {
      return setTimeout(() => {
        dispatch(removeNotification(notification.id))
      }, notification.duration)
    })
    
    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [notifications, dispatch])
  
  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          notification={notification}
          onClose={() => dispatch(removeNotification(notification.id))}
        />
      ))}
    </div>
  )
}

function Notification({ notification, onClose }) {
  const [isVisible, setIsVisible] = useState(true)
  
  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300) // 等待动画完成
  }
  
  return (
    <div className={\`notification notification-\${notification.type} \${isVisible ? 'visible' : 'hidden'}\`}>
      <div className="notification-content">
        {notification.message}
      </div>
      <button className="notification-close" onClick={handleClose}>
        ×
      </button>
    </div>
  )
}
\`\`\`

## 总结

React状态管理是构建复杂应用的关键部分，而Redux提供了一种强大、可预测的状态管理方案。通过理解Redux的核心概念和最佳实践，我们可以：

1. **构建可维护的应用**：清晰的状态结构和单向数据流使应用更易于理解和维护
2. **实现可预测的状态变化**：通过action和reducer确保状态变化的可预测性
3. **优化性能**：使用选择器、记忆化等技术避免不必要的重新渲染
4. **简化开发流程**：使用Redux Toolkit和RTK Query减少样板代码

选择合适的状态管理方案取决于应用规模和复杂度：

- **小型应用**：组件状态和Context API可能足够
- **中型应用**：Redux或MobX等状态管理库提供更好的组织
- **大型应用**：Redux + Redux Toolkit + RTK Query提供完整的状态管理解决方案

无论选择哪种方案，关键是保持状态结构清晰、状态变化可预测，并遵循最佳实践来构建可维护、可扩展的应用。`;export{n as default};
//# sourceMappingURL=19-B0OVyBbt.js.map
