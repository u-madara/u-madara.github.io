const n=`---
title: "React Hooks深度解析 - 高级Hooks与自定义Hooks"
excerpt: "深入探讨React Hooks的高级用法和自定义Hooks的开发技巧，帮助你更灵活地使用Hooks"
coverImage: "/assets/blog/preview/cover.jpg"
date: "2025-10-12"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/preview/cover.jpg"
---

# React Hooks深度解析 - 高级Hooks与自定义Hooks

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
\`\`\``;export{n as default};
//# sourceMappingURL=17-2-Da-PwK5R.js.map
