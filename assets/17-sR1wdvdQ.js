const n=`---
title: "React Hooks深度解析"
excerpt: "深入解析React Hooks的原理、使用方法和最佳实践，帮助开发者全面掌握这一革命性特性，提升React组件开发效率和代码质量"
coverImage: "/assets/blog/preview/cover.jpg"
date: "2025-11-27"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/preview/cover.jpg"
---

# React Hooks深度解析

## 前言

React Hooks是React 16.8引入的一项革命性特性，它彻底改变了我们编写React组件的方式。Hooks让我们能够在不编写class的情况下使用state和其他React特性，使函数组件拥有了与类组件同等的能力，同时提供了更简洁、更直观的代码组织方式。本文将深入解析React Hooks的原理、使用方法和最佳实践，帮助你全面掌握这一强大的特性。

## Hooks基础概念

### 为什么需要Hooks

在Hooks出现之前，React组件主要分为类组件和函数组件两种：

\`\`\`javascript
// 类组件 - 复杂且冗长
class Counter extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      count: 0
    }
    this.increment = this.increment.bind(this)
    this.decrement = this.decrement.bind(this)
  }
  
  increment() {
    this.setState(prevState => ({
      count: prevState.count + 1
    }))
  }
  
  decrement() {
    this.setState(prevState => ({
      count: prevState.count - 1
    }))
  }
  
  componentDidMount() {
    document.title = \`Count: \${this.state.count}\`
  }
  
  componentDidUpdate() {
    document.title = \`Count: \${this.state.count}\`
  }
  
  render() {
    return (
      <div>
        <h1>Count: {this.state.count}</h1>
        <button onClick={this.increment}>+</button>
        <button onClick={this.decrement}>-</button>
      </div>
    )
  }
}

// 函数组件 + Hooks - 简洁直观
import React, { useState, useEffect } from 'react'

function Counter() {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    document.title = \`Count: \${count}\`
  }, [count])
  
  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(count - 1)}>-</button>
    </div>
  )
}
\`\`\`

Hooks解决了以下问题：

1. **组件间逻辑复用困难**：高阶组件和render props模式会导致组件树嵌套过深
2. **复杂组件难以理解**：生命周期方法中包含不相关的逻辑
3. **类组件的this指向问题**：需要绑定this，容易出错
4. **类与函数的混淆**：机器和人类都难以理解类组件

### Hooks使用规则

Hooks有两个重要的使用规则，必须遵守：

\`\`\`javascript
// 规则1：只能在函数最顶层调用Hooks
// 不要在循环、条件或嵌套函数中调用Hook
function MyComponent() {
  // ✅ 正确：在顶层调用
  const [name, setName] = useState('React')
  
  if (name !== '') {
    // ❌ 错误：在条件语句中调用Hook
    const [age, setAge] = useState(25)
  }
  
  function handleClick() {
    // ❌ 错误：在嵌套函数中调用Hook
    const [count, setCount] = useState(0)
  }
  
  return <div>{name}</div>
}

// 规则2：只能在React函数中调用Hooks
// 不要在普通JavaScript函数中调用Hook
function myCustomFunction() {
  // ❌ 错误：在普通JavaScript函数中调用Hook
  const [state, setState] = useState(0)
}

// ✅ 正确：在React函数组件中调用Hook
function MyComponent() {
  const [state, setState] = useState(0)
  return <div>{state}</div>
}

// ✅ 正确：在自定义Hook中调用Hook
function useMyCustomHook() {
  const [state, setState] = useState(0)
  return [state, setState]
}
\`\`\`

## 核心Hooks详解

### useState Hook

useState是最基本的Hook，用于在函数组件中添加状态。

\`\`\`javascript
import React, { useState } from 'react'

// 基本用法
function Counter() {
  // useState返回一个数组：[当前状态, 更新状态的函数]
  const [count, setCount] = useState(0) // 0是初始值
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}

// 使用函数初始化状态
function UserProfile({ userId }) {
  // 如果初始状态需要通过计算得出，可以使用函数
  const [user, setUser] = useState(() => {
    // 这个函数只会在初始渲染时执行一次
    return fetchUser(userId)
  })
  
  return <div>{user.name}</div>
}

// 状态更新可以是对象
function Form() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  })
  
  const handleChange = (e) => {
    const { name, value } = e.target
    
    // 更新对象状态时，需要合并旧状态
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }))
  }
  
  return (
    <form>
      <input
        type="text"
        name="username"
        value={formData.username}
        onChange={handleChange}
      />
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
      />
      <input
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
      />
    </form>
  )
}

// 状态更新是异步的
function Counter() {
  const [count, setCount] = useState(0)
  
  const handleClick = () => {
    // 直接基于当前状态更新可能会得到错误结果
    setCount(count + 1) // 基于count=0更新为1
    setCount(count + 1) // 仍然基于count=0更新为1
    
    // 使用函数式更新确保基于最新状态
    setCount(prevCount => prevCount + 1) // 基于最新状态更新
    setCount(prevCount => prevCount + 1) // 基于最新状态更新
  }
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={handleClick}>Increment Twice</button>
    </div>
  )
}
\`\`\`

### useEffect Hook

useEffect用于处理副作用，如数据获取、订阅、手动更改DOM等。

\`\`\`javascript
import React, { useState, useEffect } from 'react'

// 基本用法 - 每次渲染后执行
function DocumentTitle() {
  const [count, setCount] = useState(0)
  
  // 每次渲染后都会执行
  useEffect(() => {
    console.log('Component rendered')
    document.title = \`Count: \${count}\`
  })
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}

// 依赖数组 - 只在依赖项变化时执行
function DocumentTitleWithDeps() {
  const [count, setCount] = useState(0)
  const [name, setName] = useState('React')
  
  // 只在count变化时执行
  useEffect(() => {
    console.log('Count changed')
    document.title = \`Count: \${count}\`
  }, [count]) // 依赖数组
  
  // 只在组件挂载时执行一次
  useEffect(() => {
    console.log('Component mounted')
    // 相当于componentDidMount
  }, [])
  
  return (
    <div>
      <p>Count: {count}</p>
      <p>Name: {name}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setName('Vue')}>Change Name</button>
    </div>
  )
}

// 清理函数 - 在组件卸载或下次effect执行前运行
function Timer() {
  const [seconds, setSeconds] = useState(0)
  
  useEffect(() => {
    console.log('Setting up timer')
    
    const intervalId = setInterval(() => {
      setSeconds(prevSeconds => prevSeconds + 1)
    }, 1000)
    
    // 返回清理函数
    return () => {
      console.log('Cleaning up timer')
      clearInterval(intervalId)
    }
  }, []) // 空依赖数组表示只在挂载和卸载时执行
  
  return <div>Seconds: {seconds}</div>
}

// 数据获取
function UserProfile({ userId }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true)
        const response = await fetch(\`https://api.example.com/users/\${userId}\`)
        const data = await response.json()
        setUser(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchUser()
  }, [userId]) // 当userId变化时重新获取数据
    
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!user) return <div>No user found</div>
  
  return <div>{user.name}</div>
}

// 订阅和取消订阅
function WindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  })
  
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    
    window.addEventListener('resize', handleResize)
    
    // 清理函数：移除事件监听器
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, []) // 空依赖数组，只在挂载和卸载时执行
  
  return (
    <div>
      Width: {windowSize.width}, Height: {windowSize.height}
    </div>
  )
}
\`\`\`

### useContext Hook

useContext用于在组件树中跨层级共享数据，避免props逐层传递。

\`\`\`javascript
import React, { createContext, useContext, useState } from 'react'

// 创建Context
const ThemeContext = createContext()

// 提供者组件
function App() {
  const [theme, setTheme] = useState('light')
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Toolbar />
    </ThemeContext.Provider>
  )
}

// 中间组件不需要传递props
function Toolbar() {
  return (
    <div>
      <ThemedButton />
    </div>
  )
}

// 消费者组件
function ThemedButton() {
  // 使用useContext获取Context值
  const { theme, setTheme } = useContext(ThemeContext)
  
  const style = {
    backgroundColor: theme === 'dark' ? '#333' : '#FFF',
    color: theme === 'dark' ? '#FFF' : '#333',
    padding: '10px',
    border: '1px solid'
  }
  
  return (
    <button style={style} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle Theme
    </button>
  )
}

// 多个Context
const UserContext = createContext()
const ThemeContext = createContext()

function App() {
  const [user, setUser] = useState({ name: 'John' })
  const [theme, setTheme] = useState('light')
  
  return (
    <UserContext.Provider value={{ user, setUser }}>
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <Profile />
      </ThemeContext.Provider>
    </UserContext.Provider>
  )
}

function Profile() {
  // 可以同时使用多个Context
  const { user } = useContext(UserContext)
  const { theme } = useContext(ThemeContext)
  
  return (
    <div style={{ color: theme === 'dark' ? 'white' : 'black' }}>
      Hello, {user.name}!
    </div>
  )
}

// 优化：使用自定义Hook封装Context
function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// 使用自定义Hook
function Profile() {
  const { user } = useUser()
  const { theme } = useTheme()
  
  return (
    <div style={{ color: theme === 'dark' ? 'white' : 'black' }}>
      Hello, {user.name}!
    </div>
  )
}
\`\`\`

### useReducer Hook

useReducer是useState的替代方案，用于处理更复杂的状态逻辑。

\`\`\`javascript
import React, { useReducer } from 'react'

// 基本用法
const initialState = { count: 0 }

function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 }
    case 'decrement':
      return { count: state.count - 1 }
    case 'reset':
      return { count: action.payload }
    default:
      throw new Error()
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, initialState)
  
  return (
    <div>
      Count: {state.count}
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'reset', payload: 0 })}>Reset</button>
    </div>
  )
}

// 复杂状态管理
const initialState = {
  loading: false,
  error: null,
  data: null
}

function apiReducer(state, action) {
  switch (action.type) {
    case 'fetch':
      return { ...state, loading: true, error: null }
    case 'success':
      return { ...state, loading: false, data: action.payload }
    case 'error':
      return { ...state, loading: false, error: action.payload }
    default:
      return state
  }
}

function DataFetcher({ url }) {
  const [state, dispatch] = useReducer(apiReducer, initialState)
  
  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: 'fetch' })
      
      try {
        const response = await fetch(url)
        const data = await response.json()
        dispatch({ type: 'success', payload: data })
      } catch (error) {
        dispatch({ type: 'error', payload: error.message })
      }
    }
    
    fetchData()
  }, [url])
  
  if (state.loading) return <div>Loading...</div>
  if (state.error) return <div>Error: {state.error}</div>
  
  return (
    <div>
      <pre>{JSON.stringify(state.data, null, 2)}</pre>
    </div>
  )
}

// 惰性初始化
function init(initialCount) {
  return { count: initialCount }
}

function Counter({ initialCount = 0 }) {
  const [state, dispatch] = useReducer(reducer, initialCount, init)
  
  return (
    <div>
      Count: {state.count}
      <button onClick={() => dispatch({ type: 'reset', payload: initialCount })}>
        Reset
      </button>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
    </div>
  )
}
\`\`\`

## 高级Hooks详解

### useCallback Hook

useCallback用于缓存函数，避免不必要的重新创建。

\`\`\`javascript
import React, { useState, useCallback } from 'react'

// 基本用法
function ParentComponent() {
  const [count, setCount] = useState(0)
  
  // 每次渲染都会创建新的函数
  const handleClickWithoutCallback = () => {
    console.log('Button clicked')
  }
  
  // 使用useCallback缓存函数
  const handleClickWithCallback = useCallback(() => {
    console.log('Button clicked')
  }, []) // 空依赖数组，函数不会改变
  
  // 带依赖的useCallback
  const handleClickWithValue = useCallback(() => {
    console.log(\`Count is \${count}\`)
  }, [count]) // 当count变化时，函数会重新创建
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <ChildComponent onClick={handleClickWithCallback} />
    </div>
  )
}

// 优化子组件渲染
const ChildComponent = React.memo(({ onClick }) => {
  console.log('ChildComponent rendered')
  return <button onClick={onClick}>Child Button</button>
})

// 实际应用场景：事件处理器
function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn React', completed: false },
    { id: 2, text: 'Write Code', completed: false }
  ])
  
  // 使用useCallback优化事件处理器
  const handleToggle = useCallback((id) => {
    setTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    )
  }, [])
  
  const handleDelete = useCallback((id) => {
    setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id))
  }, [])
  
  return (
    <ul>
      {todos.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      ))}
    </ul>
  )
}

const TodoItem = React.memo(({ todo, onToggle, onDelete }) => {
  return (
    <li>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
      />
      <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
        {todo.text}
      </span>
      <button onClick={() => onDelete(todo.id)}>Delete</button>
    </li>
  )
})
\`\`\`

### useMemo Hook

useMemo用于缓存计算结果，避免重复计算。

\`\`\`javascript
import React, { useState, useMemo } from 'react'

// 基本用法
function ExpensiveCalculation({ a, b }) {
  // 使用useMemo缓存计算结果
  const result = useMemo(() => {
    console.log('Performing expensive calculation...')
    // 模拟耗时计算
    let result = 0
    for (let i = 0; i < 1000000; i++) {
      result += a * b
    }
    return result
  }, [a, b]) // 只有当a或b变化时才重新计算
  
  return <div>Result: {result}</div>
}

function Calculator() {
  const [a, setA] = useState(10)
  const [b, setB] = useState(20)
  const [counter, setCounter] = useState(0)
  
  return (
    <div>
      <div>
        <input value={a} onChange={e => setA(Number(e.target.value))} />
        <input value={b} onChange={e => setB(Number(e.target.value))} />
      </div>
      
      <ExpensiveCalculation a={a} b={b} />
      
      <div>
        <p>Counter: {counter}</p>
        <button onClick={() => setCounter(counter + 1)}>Increment Counter</button>
      </div>
    </div>
  )
}

// 实际应用场景：过滤和排序
function UserList({ users, filter, sortBy }) {
  // 使用useMemo缓存过滤和排序结果
  const filteredAndSortedUsers = useMemo(() => {
    console.log('Filtering and sorting users...')
    
    let result = [...users]
    
    // 过滤
    if (filter) {
      result = result.filter(user =>
        user.name.toLowerCase().includes(filter.toLowerCase())
      )
    }
    
    // 排序
    if (sortBy) {
      result.sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name)
        } else if (sortBy === 'age') {
          return a.age - b.age
        }
        return 0
      })
    }
    
    return result
  }, [users, filter, sortBy])
  
  return (
    <ul>
      {filteredAndSortedUsers.map(user => (
        <li key={user.id}>
          {user.name} (Age: {user.age})
        </li>
      ))}
    </ul>
  )
}

// 使用useMemo缓存复杂对象
function Chart({ data, options }) {
  // 缓存图表配置对象
  const chartOptions = useMemo(() => ({
    ...options,
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Chart Title'
      }
    }
  }), [options])
  
  // 缓存图表数据
  const chartData = useMemo(() => ({
    labels: data.map(item => item.label),
    datasets: [
      {
        label: 'Dataset',
        data: data.map(item => item.value),
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ]
  }), [data])
  
  return <div>Chart with options and data</div>
}
\`\`\`

### useRef Hook

useRef用于获取DOM元素引用或在多次渲染之间保存可变值。

\`\`\`javascript
import React, { useRef, useEffect, useState } from 'react'

// 获取DOM元素引用
function TextInputWithFocusButton() {
  const inputEl = useRef(null)
  
  const onButtonClick = () => {
    // \`current\` 指向已挂载到 DOM 上的文本输入元素
    inputEl.current.focus()
  }
  
  return (
    <div>
      <input ref={inputEl} type="text" />
      <button onClick={onButtonClick}>Focus the input</button>
    </div>
  )
}

// 保存可变值
function Timer() {
  const [count, setCount] = useState(0)
  const intervalRef = useRef()
  
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCount(prevCount => prevCount + 1)
    }, 1000)
    
    return () => {
      clearInterval(intervalRef.current)
    }
  }, [])
  
  const handleStop = () => {
    clearInterval(intervalRef.current)
  }
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={handleStop}>Stop Timer</button>
    </div>
  )
}

// 获取上一轮的props或state
function usePrevious(value) {
  const ref = useRef()
  
  useEffect(() => {
    ref.current = value
  })
  
  return ref.current
}

function Counter() {
  const [count, setCount] = useState(0)
  const prevCount = usePrevious(count)
  
  return (
    <div>
      <h1>Now: {count}, before: {prevCount}</h1>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}

// 自定义Hook中使用useRef
function useInterval(callback, delay) {
  const savedCallback = useRef()
  
  // 保存最新的callback
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])
  
  // 设置interval
  useEffect(() => {
    function tick() {
      savedCallback.current()
    }
    
    if (delay !== null) {
      const id = setInterval(tick, delay)
      return () => clearInterval(id)
    }
  }, [delay])
}

function Counter() {
  const [count, setCount] = useState(0)
  
  useInterval(() => {
    setCount(count + 1)
  }, 1000)
  
  return <h1>{count}</h1>
}
\`\`\`

## 自定义Hooks

自定义Hooks是复用状态逻辑的强大方式，它遵循与内置Hooks相同的规则。

### 创建自定义Hooks

\`\`\`javascript
import { useState, useEffect } from 'react'

// 自定义Hook：数据获取
function useFetch(url) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(url)
        const data = await response.json()
        setData(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [url])
  
  return { data, loading, error }
}

// 使用自定义Hook
function UserProfile({ userId }) {
  const { data: user, loading, error } = useFetch(\`https://api.example.com/users/\${userId}\`)
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!user) return <div>No user found</div>
  
  return <div>{user.name}</div>
}

// 自定义Hook：本地存储
function useLocalStorage(key, initialValue) {
  // 获取初始值
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(\`Error reading localStorage key "\${key}":\`, error)
      return initialValue
    }
  })
  
  // 更新值的函数
  const setValue = (value) => {
    try {
      // 允许value是函数，类似useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(\`Error setting localStorage key "\${key}":\`, error)
    }
  }
  
  return [storedValue, setValue]
}

// 使用自定义Hook
function App() {
  const [name, setName] = useLocalStorage('name', 'React')
  
  return (
    <div>
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <p>Hello, {name}!</p>
    </div>
  )
}

// 自定义Hook：防抖
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])
  
  return debouncedValue
}

// 使用自定义Hook
function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  
  useEffect(() => {
    // 使用防抖后的搜索词进行API调用
    if (debouncedSearchTerm) {
      console.log('Searching for:', debouncedSearchTerm)
    }
  }, [debouncedSearchTerm])
  
  return (
    <input
      type="text"
      value={searchTerm}
      onChange={e => setSearchTerm(e.target.value)}
      placeholder="Search..."
    />
  )
}

// 自定义Hook：窗口大小
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  })
  
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    
    window.addEventListener('resize', handleResize)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  return windowSize
}

// 使用自定义Hook
function WindowSizeComponent() {
  const { width, height } = useWindowSize()
  
  return (
    <div>
      Window size: {width} x {height}
    </div>
  )
}

// 自定义Hook：权限控制
function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // 检查用户是否已登录
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        if (token) {
          const response = await fetch('/api/auth/me', {
            headers: {
              Authorization: \`Bearer \${token}\`
            }
          })
          
          if (response.ok) {
            const userData = await response.json()
            setUser(userData)
          } else {
            localStorage.removeItem('token')
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [])
  
  const login = async (credentials) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })
      
      if (response.ok) {
        const { token, user } = await response.json()
        localStorage.setItem('token', token)
        setUser(user)
        return { success: true }
      } else {
        const error = await response.json()
        return { success: false, error: error.message }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
  
  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }
  
  return { user, loading, login, logout }
}

// 使用自定义Hook
function AuthComponent() {
  const { user, loading, login, logout } = useAuth()
  
  if (loading) return <div>Loading...</div>
  
  if (!user) {
    return <LoginForm onLogin={login} />
  }
  
  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
\`\`\`

## Hooks最佳实践

### 规则与约定

\`\`\`javascript
// 1. 始终使用use前缀命名自定义Hook
function useMyCustomHook() {
  // Hook逻辑
}

// 2. 在多个组件间复用有状态逻辑
// 而不是复用UI
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue)
  
  const increment = useCallback(() => setCount(c => c + 1), [])
  const decrement = useCallback(() => setCount(c => c - 1), [])
  const reset = useCallback(() => setCount(initialValue), [initialValue])
  
  return { count, increment, decrement, reset }
}

// 3. 将相关状态和逻辑组织在一起
function useUserProfile(userId) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true)
        const response = await fetch(\`/api/users/\${userId}\`)
        const userData = await response.json()
        setUser(userData)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    if (userId) {
      fetchUser()
    }
  }, [userId])
  
  const updateUser = useCallback(async (updates) => {
    try {
      const response = await fetch(\`/api/users/\${userId}\`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })
      
      if (response.ok) {
        const updatedUser = await response.json()
        setUser(updatedUser)
        return { success: true }
      } else {
        const error = await response.json()
        return { success: false, error: error.message }
      }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [userId])
  
  return { user, loading, error, updateUser }
}

// 4. 使用条件渲染而不是条件Hook
// 错误示例
function BadComponent({ shouldUseFeature }) {
  const [data, setData] = useState(null)
  
  if (shouldUseFeature) {
    // 错误：在条件语句中使用Hook
    const [featureData, setFeatureData] = useState(null)
  }
  
  return <div>{data}</div>
}

// 正确示例
function GoodComponent({ shouldUseFeature }) {
  const [data, setData] = useState(null)
  const [featureData, setFeatureData] = useState(null)
  
  // 在Hook内部使用条件逻辑
  useEffect(() => {
    if (shouldUseFeature) {
      // 获取featureData
      fetchFeatureData().then(setFeatureData)
    }
  }, [shouldUseFeature])
  
  return (
    <div>
      {data}
      {shouldUseFeature && featureData}
    </div>
  )
}
\`\`\`

### 性能优化

\`\`\`javascript
// 1. 使用React.memo优化组件渲染
const ExpensiveComponent = React.memo(({ data, onClick }) => {
  console.log('ExpensiveComponent rendered')
  return (
    <div>
      {data.map(item => (
        <div key={item.id} onClick={() => onClick(item.id)}>
          {item.name}
        </div>
      ))}
    </div>
  )
})

function ParentComponent() {
  const [data, setData] = useState([])
  const [count, setCount] = useState(0)
  
  // 使用useCallback缓存函数
  const handleClick = useCallback((id) => {
    console.log('Item clicked:', id)
  }, [])
  
  return (
    <div>
      <ExpensiveComponent data={data} onClick={handleClick} />
      <button onClick={() => setCount(count + 1)}>Increment: {count}</button>
    </div>
  )
}

// 2. 使用useMemo缓存计算结果
function FilteredList({ items, filter }) {
  const filteredItems = useMemo(() => {
    console.log('Filtering items...')
    return items.filter(item => 
      item.name.toLowerCase().includes(filter.toLowerCase())
    )
  }, [items, filter])
  
  return (
    <ul>
      {filteredItems.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  )
}

// 3. 使用useReducer替代多个useState
function complexReducer(state, action) {
  switch (action.type) {
    case 'setField':
      return { ...state, [action.field]: action.value }
    case 'reset':
      return action.initialState
    default:
      return state
  }
}

function useForm(initialState) {
  const [state, dispatch] = useReducer(complexReducer, initialState)
  
  const setField = useCallback((field, value) => {
    dispatch({ type: 'setField', field, value })
  }, [])
  
  const reset = useCallback(() => {
    dispatch({ type: 'reset', initialState })
  }, [initialState])
  
  return [state, setField, reset]
}

function MyForm() {
  const [formData, setField, resetForm] = useForm({
    username: '',
    email: '',
    password: ''
  })
  
  const handleSubmit = (e) => {
    e.preventDefault()
    console.log(formData)
    resetForm()
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.username}
        onChange={e => setField('username', e.target.value)}
        placeholder="Username"
      />
      <input
        value={formData.email}
        onChange={e => setField('email', e.target.value)}
        placeholder="Email"
      />
      <input
        value={formData.password}
        onChange={e => setField('password', e.target.value)}
        type="password"
        placeholder="Password"
      />
      <button type="submit">Submit</button>
    </form>
  )
}
\`\`\`

## 总结

React Hooks彻底改变了我们编写React组件的方式，它提供了以下优势：

1. **更简洁的代码**：函数组件比类组件更简洁，没有this绑定问题
2. **更好的逻辑复用**：自定义Hooks提供了强大的逻辑复用机制
3. **更清晰的关注点分离**：相关逻辑可以组织在一起，而不是分散在生命周期方法中
4. **更好的类型推导**：TypeScript对Hooks的支持更好
5. **更容易测试**：函数组件和Hooks更容易进行单元测试

在使用Hooks时，应该遵循以下最佳实践：

1. **遵守Hooks规则**：只在顶层调用Hooks，只在React函数中调用Hooks
2. **合理使用useCallback和useMemo**：避免过度优化，只在必要时使用
3. **创建自定义Hooks**：将复杂逻辑提取到自定义Hooks中
4. **保持Hook简单**：每个Hook应该有单一职责
5. **正确处理依赖数组**：确保依赖数组包含所有外部依赖

通过深入理解React Hooks的原理和最佳实践，我们可以编写出更简洁、更高效、更可维护的React应用。`;export{n as default};
//# sourceMappingURL=17-sR1wdvdQ.js.map
