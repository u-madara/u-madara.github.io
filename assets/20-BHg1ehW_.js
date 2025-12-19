const n=`---
title: "React性能优化与最佳实践"
excerpt: "深入探讨React应用的性能优化策略，从组件渲染优化到代码分割，从内存管理到构建优化，帮助开发者构建高性能的React应用"
coverImage: "/assets/blog/dynamic-routing/cover.jpg"
date: "2025-10-26"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/preview/cover.jpg"
---

# React性能优化与最佳实践

## 前言

随着React应用的复杂度增加，性能优化变得至关重要。良好的性能不仅提升用户体验，还能降低服务器负载和带宽消耗。本文将深入探讨React应用的性能优化策略，从组件渲染优化到代码分割，从内存管理到构建优化，帮助你构建高性能的React应用。

## React渲染机制与性能瓶颈

### 虚拟DOM与Diff算法

React使用虚拟DOM和Diff算法来高效更新UI：

\`\`\`jsx
// 虚拟DOM示例
const element = <h1>Hello, world!</h1>
// 转换为虚拟DOM对象
const vElement = {
  type: 'h1',
  props: {
    children: 'Hello, world!'
  }
}

// Diff算法比较新旧虚拟DOM树
// 1. 同层比较
// 2. 不同类型元素替换整个子树
// 3. 相同类型元素只更新属性
// 4. 使用key标识列表元素
\`\`\`

### 组件渲染过程

React组件的渲染过程包括：

1. **Render阶段**：计算组件的虚拟DOM
2. **Commit阶段**：将虚拟DOM变更应用到真实DOM

\`\`\`jsx
// 组件渲染示例
function MyComponent({ name, age }) {
  console.log('Component rendered')
  
  return (
    <div>
      <h1>{name}</h1>
      <p>Age: {age}</p>
    </div>
  )
}

// 每次props或state变化都会触发重新渲染
\`\`\`

### 性能瓶颈识别

常见的性能瓶颈包括：

1. **不必要的重新渲染**：组件在没有实际变化时重新渲染
2. **昂贵的计算**：在渲染过程中执行复杂计算
3. **大型列表渲染**：渲染大量列表项导致性能下降
4. **内存泄漏**：未正确清理副作用导致内存泄漏

## 组件渲染优化

### React.memo

使用React.memo对函数组件进行记忆化，避免不必要的重新渲染：

\`\`\`jsx
import React from 'react'

// 普通组件 - 每次父组件渲染都会重新渲染
function UserProfile({ user }) {
  console.log('UserProfile rendered')
  return <div>{user.name}</div>
}

// 使用React.memo优化 - 只有props变化时才重新渲染
const OptimizedUserProfile = React.memo(function UserProfile({ user }) {
  console.log('OptimizedUserProfile rendered')
  return <div>{user.name}</div>
})

// 自定义比较函数
const CustomMemoUserProfile = React.memo(
  function UserProfile({ user }) {
    console.log('CustomMemoUserProfile rendered')
    return <div>{user.name}</div>
  },
  (prevProps, nextProps) => {
    // 返回true表示props相同，不重新渲染
    // 返回false表示props不同，重新渲染
    return prevProps.user.id === nextProps.user.id && 
           prevProps.user.name === nextProps.user.name
  }
)

// 使用示例
function App() {
  const [user, setUser] = useState({ id: 1, name: 'John', age: 30 })
  const [count, setCount] = useState(0)
  
  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Increment: {count}</button>
      <button onClick={() => setUser({ ...user, age: user.age + 1 })}>
        Update Age
      </button>
      
      {/* 普通组件 - 每次count变化都会重新渲染 */}
      <UserProfile user={user} />
      
      {/* 优化组件 - 只有user变化时才重新渲染 */}
      <OptimizedUserProfile user={user} />
      
      {/* 自定义比较组件 - 只有id和name变化时才重新渲染 */}
      <CustomMemoUserProfile user={user} />
    </div>
  )
}
\`\`\`

### useMemo

使用useMemo缓存计算结果：

\`\`\`jsx
import React, { useMemo } from 'react'

// 昂贵的计算函数
function expensiveCalculation(items) {
  console.log('Expensive calculation executed')
  return items.reduce((sum, item) => sum + item.value, 0)
}

// 未优化的组件
function UnoptimizedComponent({ items, filter }) {
  // 每次渲染都会执行昂贵计算
  const total = expensiveCalculation(items)
  
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(filter.toLowerCase())
  )
  
  return (
    <div>
      <p>Total: {total}</p>
      <ul>
        {filteredItems.map(item => (
          <li key={item.id}>{item.name}: {item.value}</li>
        ))}
      </ul>
    </div>
  )
}

// 优化后的组件
function OptimizedComponent({ items, filter }) {
  // 只有items变化时才重新计算
  const total = useMemo(() => expensiveCalculation(items), [items])
  
  // 只有items或filter变化时才重新计算
  const filteredItems = useMemo(() => 
    items.filter(item => 
      item.name.toLowerCase().includes(filter.toLowerCase())
    ), [items, filter]
  )
  
  return (
    <div>
      <p>Total: {total}</p>
      <ul>
        {filteredItems.map(item => (
          <li key={item.id}>{item.name}: {item.value}</li>
        ))}
      </ul>
    </div>
  )
}

// 复杂计算示例
function DataVisualization({ data, config }) {
  const processedData = useMemo(() => {
    // 复杂数据处理逻辑
    const sortedData = [...data].sort((a, b) => a.value - b.value)
    
    // 计算统计信息
    const stats = {
      min: sortedData[0]?.value || 0,
      max: sortedData[sortedData.length - 1]?.value || 0,
      average: sortedData.reduce((sum, item) => sum + item.value, 0) / sortedData.length || 0
    }
    
    // 根据配置处理数据
    return {
      data: config.normalize 
        ? sortedData.map(item => ({
            ...item,
            normalizedValue: (item.value - stats.min) / (stats.max - stats.min)
          }))
        : sortedData,
      stats
    }
  }, [data, config])
  
  return (
    <div>
      <Chart data={processedData.data} />
      <Stats stats={processedData.stats} />
    </div>
  )
}
\`\`\`

### useCallback

使用useMemo缓存函数引用：

\`\`\`jsx
import React, { useState, useCallback } from 'react'

// 未优化的组件
function UnoptimizedParent() {
  const [count, setCount] = useState(0)
  
  // 每次渲染都会创建新的函数
  const handleClick = () => {
    console.log('Button clicked')
  }
  
  return (
    <div>
      <button onClick={() => setCount(count + 1)}>
        Increment: {count}
      </button>
      <UnoptimizedChild onClick={handleClick} />
    </div>
  )
}

// 子组件使用React.memo优化
const UnoptimizedChild = React.memo(function Child({ onClick }) {
  console.log('Child rendered')
  return <button onClick={onClick}>Child Button</button>
})

// 优化后的组件
function OptimizedParent() {
  const [count, setCount] = useState(0)
  
  // 使用useCallback缓存函数
  const handleClick = useCallback(() => {
    console.log('Button clicked')
  }, []) // 空依赖数组表示函数永不变化
  
  // 带依赖的useCallback
  const handleCountClick = useCallback((value) => {
    console.log(\`Count button clicked with value: \${value}\`)
  }, [])
  
  return (
    <div>
      <button onClick={() => setCount(count + 1)}>
        Increment: {count}
      </button>
      <OptimizedChild onClick={handleClick} />
      <OptimizedChildWithParam onClick={handleCountClick} />
    </div>
  )
}

// 带参数的回调函数
const OptimizedChildWithParam = React.memo(function ChildWithParam({ onClick }) {
  console.log('ChildWithParam rendered')
  return (
    <div>
      {[1, 2, 3].map(value => (
        <button key={value} onClick={() => onClick(value)}>
          Button {value}
        </button>
      ))}
    </div>
  )
})

// 实际应用示例
function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn React', completed: false },
    { id: 2, text: 'Build a project', completed: false }
  ])
  const [filter, setFilter] = useState('all')
  
  // 使用useCallback缓存函数
  const addTodo = useCallback(text => {
    setTodos(prevTodos => [
      ...prevTodos,
      { id: Date.now(), text, completed: false }
    ])
  }, [])
  
  const toggleTodo = useCallback(id => {
    setTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    )
  }, [])
  
  const deleteTodo = useCallback(id => {
    setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id))
  }, [])
  
  const filteredTodos = useMemo(() => {
    switch (filter) {
      case 'active':
        return todos.filter(todo => !todo.completed)
      case 'completed':
        return todos.filter(todo => todo.completed)
      default:
        return todos
    }
  }, [todos, filter])
  
  return (
    <div>
      <TodoForm addTodo={addTodo} />
      <TodoFilter filter={filter} setFilter={setFilter} />
      <TodoListItems 
        todos={filteredTodos} 
        toggleTodo={toggleTodo} 
        deleteTodo={deleteTodo} 
      />
    </div>
  )
}

// 使用React.memo优化的子组件
const TodoForm = React.memo(function TodoForm({ addTodo }) {
  const [text, setText] = useState('')
  
  const handleSubmit = e => {
    e.preventDefault()
    if (text.trim()) {
      addTodo(text)
      setText('')
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Add new todo"
      />
      <button type="submit">Add</button>
    </form>
  )
})

const TodoListItems = React.memo(function TodoListItems({ todos, toggleTodo, deleteTodo }) {
  return (
    <ul>
      {todos.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          toggleTodo={toggleTodo}
          deleteTodo={deleteTodo}
        />
      ))}
    </ul>
  )
})

const TodoItem = React.memo(function TodoItem({ todo, toggleTodo, deleteTodo }) {
  return (
    <li>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => toggleTodo(todo.id)}
      />
      <span className={todo.completed ? 'completed' : ''}>
        {todo.text}
      </span>
      <button onClick={() => deleteTodo(todo.id)}>Delete</button>
    </li>
  )
})
\`\`\`

## 列表渲染优化

### 虚拟化长列表

对于大型列表，使用虚拟滚动只渲染可见区域：

\`\`\`jsx
import React, { useState, useRef, useEffect, useMemo } from 'react'

// 简单的虚拟滚动实现
function VirtualList({ items, itemHeight, containerHeight }) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef(null)
  
  // 计算可见区域的项目
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length - 1
    )
    
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      ...item,
      index: startIndex + index
    }))
  }, [items, itemHeight, containerHeight, scrollTop])
  
  const handleScroll = () => {
    setScrollTop(containerRef.current.scrollTop)
  }
  
  return (
    <div
      ref={containerRef}
      style={{
        height: containerHeight,
        overflow: 'auto'
      }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map(item => (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              top: item.index * itemHeight,
              height: itemHeight,
              width: '100%'
            }}
          >
            {item.content}
          </div>
        ))}
      </div>
    </div>
  )
}

// 使用示例
function LargeListDemo() {
  const [items] = useState(() => 
    Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      content: \`Item \${i}\`,
      value: Math.random() * 100
    }))
  )
  
  return (
    <div>
      <h2>Virtual List Demo</h2>
      <VirtualList
        items={items}
        itemHeight={50}
        containerHeight={500}
      />
    </div>
  )
}

// 使用react-window库
import { FixedSizeList as List } from 'react-window'

function ReactWindowExample() {
  const [items] = useState(() => 
    Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      text: \`Item \${i}\`,
      value: Math.floor(Math.random() * 100)
    }))
  )
  
  // 渲染单个行
  const Row = ({ index, style }) => (
    <div style={style}>
      {items[index].text} - Value: {items[index].value}
    </div>
  )
  
  return (
    <List
      height={500}
      itemCount={items.length}
      itemSize={35}
      width="100%"
    >
      {Row}
    </List>
  )
}

// 使用react-virtualized库
import { Table, Column } from 'react-virtualized'
import 'react-virtualized/styles.css'

function ReactVirtualizedTable() {
  const [list] = useState(() => 
    Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: \`Name \${i}\`,
      email: \`email\${i}@example.com\`,
      age: Math.floor(Math.random() * 50) + 18
    }))
  )
  
  return (
    <Table
      width={800}
      height={500}
      headerHeight={50}
      rowHeight={40}
      rowCount={list.length}
      rowGetter={({ index }) => list[index]}
    >
      <Column label="ID" dataKey="id" width={100} />
      <Column label="Name" dataKey="name" width={200} />
      <Column label="Email" dataKey="email" width={250} />
      <Column label="Age" dataKey="age" width={100} />
    </Table>
  )
}
\`\`\`

### 列表key优化

正确使用key属性优化列表渲染：

\`\`\`jsx
// 不好的做法 - 使用数组索引作为key
function BadKeyExample({ items }) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>
          {item.name}
          <button onClick={() => removeItem(index)}>Remove</button>
        </li>
      ))}
    </ul>
  )
}

// 好的做法 - 使用唯一ID作为key
function GoodKeyExample({ items }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>
          {item.name}
          <button onClick={() => removeItem(item.id)}>Remove</button>
        </li>
      ))}
    </ul>
  )
}

// 复杂列表优化
function OptimizedList({ items }) {
  const [selectedId, setSelectedId] = useState(null)
  
  // 使用useMemo缓存渲染的列表项
  const listItems = useMemo(() => 
    items.map(item => (
      <ListItem
        key={item.id}
        item={item}
        isSelected={selectedId === item.id}
        onSelect={() => setSelectedId(item.id)}
      />
    )), [items, selectedId])
  
  return <ul>{listItems}</ul>
}

// 优化的列表项组件
const ListItem = React.memo(function ListItem({ item, isSelected, onSelect }) {
  return (
    <li 
      className={isSelected ? 'selected' : ''}
      onClick={onSelect}
    >
      {item.name}
    </li>
  )
})
\`\`\`

## 代码分割与懒加载

### 动态导入

使用动态导入实现代码分割：

\`\`\`jsx
import React, { Suspense, lazy } from 'react'

// 懒加载组件
const LazyComponent = lazy(() => import('./LazyComponent'))

function App() {
  return (
    <div>
      <h1>My App</h1>
      
      {/* 使用Suspense包装懒加载组件 */}
      <Suspense fallback={<div>Loading...</div>}>
        <LazyComponent />
      </Suspense>
    </div>
  )
}

// 路由级别的代码分割
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'

const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('./pages/About'))
const Products = lazy(() => import('./pages/Products'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))

function AppRouter() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/products">Products</Link>
      </nav>
      
      <Suspense fallback={<div>Loading page...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

// 条件加载组件
function ConditionalLoading() {
  const [showDetails, setShowDetails] = useState(false)
  
  // 只有当showDetails为true时才加载Details组件
  const LazyDetails = lazy(() => import('./Details'))
  
  return (
    <div>
      <button onClick={() => setShowDetails(true)}>
        Show Details
      </button>
      
      {showDetails && (
        <Suspense fallback={<div>Loading details...</div>}>
          <LazyDetails />
        </Suspense>
      )}
    </div>
  )
}

// 预加载组件
function PreloadExample() {
  const [componentLoaded, setComponentLoaded] = useState(false)
  const ComponentRef = useRef(null)
  
  // 预加载组件但不立即渲染
  const preloadComponent = () => {
    import('./HeavyComponent').then(module => {
      ComponentRef.current = module.default
      setComponentLoaded(true)
    })
  }
  
  const renderComponent = () => {
    if (ComponentRef.current) {
      const Component = ComponentRef.current
      return <Component />
    }
    return null
  }
  
  return (
    <div>
      <button onClick={preloadComponent}>Preload Component</button>
      <button onClick={() => setComponentLoaded(true)}>
        Render Component
      </button>
      
      {componentLoaded && (
        <Suspense fallback={<div>Loading...</div>}>
          {renderComponent()}
        </Suspense>
      )}
    </div>
  )
}
\`\`\`

### Webpack代码分割

配置Webpack进行代码分割：

\`\`\`javascript
// webpack.config.js
module.exports = {
  // ...其他配置
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // 将node_modules中的代码打包到vendor
        vendor: {
          test: /[\\\\/]node_modules[\\\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        // 公共代码打包到common
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          enforce: true
        }
      }
    }
  }
}

// 使用动态导入指定chunk名称
const LazyComponent = lazy(() => 
  import(/* webpackChunkName: "lazy-component" */ './LazyComponent')
)

// 多个组件打包到同一个chunk
const AdminDashboard = lazy(() => 
  import(/* webpackChunkName: "admin" */ './pages/AdminDashboard')
)
const UserManagement = lazy(() => 
  import(/* webpackChunkName: "admin" */ './pages/UserManagement')
)
const Reports = lazy(() => 
  import(/* webpackChunkName: "admin" */ './pages/Reports')
)
\`\`\`

## 内存管理与资源优化

### 内存泄漏预防

预防React应用中的内存泄漏：

\`\`\`jsx
// 订阅和取消订阅
function SubscriptionComponent() {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    // 创建订阅
    const subscription = dataSource.subscribe(data => {
      setData(data)
    })
    
    // 清理函数 - 组件卸载时取消订阅
    return () => {
      subscription.unsubscribe()
    }
  }, [])
  
  return <div>{data ? data : 'Loading...'}</div>
}

// 定时器清理
function TimerComponent() {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    const timerId = setInterval(() => {
      setCount(prevCount => prevCount + 1)
    }, 1000)
    
    // 清理定时器
    return () => clearInterval(timerId)
  }, [])
  
  return <div>Count: {count}</div>
}

// 事件监听器清理
function EventListenerComponent() {
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
    
    // 清理事件监听器
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  return (
    <div>
      Width: {windowSize.width}, Height: {windowSize.height}
    </div>
  )
}

// 异步操作取消
function AsyncComponent() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    let cancelled = false
    
    const fetchData = async () => {
      setLoading(true)
      
      try {
        const response = await fetch('/api/data')
        const result = await response.json()
        
        // 只有组件未卸载时才更新状态
        if (!cancelled) {
          setData(result)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Fetch error:', error)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    
    fetchData()
    
    // 清理函数 - 设置取消标志
    return () => {
      cancelled = true
    }
  }, [])
  
  if (loading) return <div>Loading...</div>
  return <div>{data ? JSON.stringify(data) : 'No data'}</div>
}

// 使用AbortController取消fetch请求
function AbortControllerComponent() {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    const controller = new AbortController()
    
    fetch('/api/data', { signal: controller.signal })
      .then(response => response.json())
      .then(data => setData(data))
      .catch(error => {
        if (error.name !== 'AbortError') {
          console.error('Fetch error:', error)
        }
      })
    
    // 取消请求
    return () => controller.abort()
  }, [])
  
  return <div>{data ? JSON.stringify(data) : 'Loading...'}</div>
}
\`\`\`

### 资源优化

优化图片、字体等资源加载：

\`\`\`jsx
// 图片懒加载
function LazyImage({ src, alt, placeholder, className }) {
  const [imageSrc, setImageSrc] = useState(placeholder)
  const [imageRef, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })
  
  useEffect(() => {
    if (inView && src) {
      setImageSrc(src)
    }
  }, [inView, src])
  
  return (
    <img
      ref={imageRef}
      src={imageSrc}
      alt={alt}
      className={className}
    />
  )
}

// 响应式图片
function ResponsiveImage({ src, alt, sizes, className }) {
  const [currentSrc, setCurrentSrc] = useState('')
  
  useEffect(() => {
    const updateSrc = () => {
      const width = window.innerWidth
      
      if (width < 768 && src.mobile) {
        setCurrentSrc(src.mobile)
      } else if (width < 1024 && src.tablet) {
        setCurrentSrc(src.tablet)
      } else {
        setCurrentSrc(src.desktop)
      }
    }
    
    updateSrc()
    window.addEventListener('resize', updateSrc)
    
    return () => window.removeEventListener('resize', updateSrc)
  }, [src])
  
  return (
    <img
      src={currentSrc}
      alt={alt}
      sizes={sizes}
      className={className}
    />
  )
}

// 使用Intersection Observer的图片懒加载
function IntersectionObserverImage({ src, alt, className }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef()
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    
    if (imgRef.current) {
      observer.observe(imgRef.current)
    }
    
    return () => observer.disconnect()
  }, [])
  
  return (
    <div ref={imgRef} className={className}>
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          style={{ opacity: isLoaded ? 1 : 0 }}
        />
      )}
    </div>
  )
}
\`\`\`

## 构建与部署优化

### Webpack优化配置

\`\`\`javascript
// webpack.prod.js
const TerserPlugin = require('terser-webpack-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')

module.exports = {
  mode: 'production',
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // 移除console
            pure_funcs: ['console.log'] // 移除特定函数
          }
        }
      }),
      new CssMinimizerPlugin()
    ],
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\\\/]node_modules[\\\\/]/,
          name: 'vendors',
          chunks: 'all',
        }
      }
    }
  },
  plugins: [
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\\.(js|css|html|svg)$/,
      threshold: 8192,
      minRatio: 0.8
    })
  ]
}
\`\`\`

### 性能监控与分析

\`\`\`jsx
// 性能监控组件
function PerformanceMonitor() {
  useEffect(() => {
    // 监控首屏加载时间
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'paint') {
          console.log(\`\${entry.name}: \${entry.startTime}ms\`)
        }
      }
    })
    
    observer.observe({ entryTypes: ['paint'] })
    
    // 监控资源加载时间
    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log(\`Resource: \${entry.name} - \${entry.duration}ms\`)
      }
    })
    
    resourceObserver.observe({ entryTypes: ['resource'] })
    
    return () => {
      observer.disconnect()
      resourceObserver.disconnect()
    }
  }, [])
  
  return null // 这个组件只用于监控，不渲染任何内容
}

// React Profiler集成
import { Profiler } from 'react'

function onRenderCallback(id, phase, actualDuration) {
  console.log('Component:', id)
  console.log('Phase:', phase) // 'mount' or 'update'
  console.log('Actual duration:', actualDuration)
  
  // 发送性能数据到分析服务
  if (window.analytics) {
    window.analytics.track('component-render-performance', {
      componentId: id,
      phase,
      duration: actualDuration
    })
  }
}

function App() {
  return (
    <div>
      <Profiler id="Navigation" onRender={onRenderCallback}>
        <Navigation />
      </Profiler>
      
      <Profiler id="MainContent" onRender={onRenderCallback}>
        <MainContent />
      </Profiler>
    </div>
  )
}

// 自定义性能Hook
function usePerformanceMonitor(componentName) {
  const renderStartTime = useRef(Date.now())
  
  useEffect(() => {
    const renderEndTime = Date.now()
    const renderTime = renderEndTime - renderStartTime.current
    
    console.log(\`\${componentName} rendered in \${renderTime}ms\`)
    
    // 更新开始时间为下次渲染准备
    renderStartTime.current = Date.now()
  })
  
  return null
}

// 使用性能监控Hook
function ExpensiveComponent() {
  usePerformanceMonitor('ExpensiveComponent')
  
  // 组件逻辑...
  return <div>Expensive Component</div>
}
\`\`\`

## 实际应用案例

### 高性能数据表格

\`\`\`jsx
import React, { useMemo, useState, useCallback } from 'react'
import { FixedSizeList as List } from 'react-window'

function HighPerformanceDataTable({ data }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' })
  const [filterText, setFilterText] = useState('')
  
  // 过滤和排序数据
  const processedData = useMemo(() => {
    let filteredData = data.filter(item => 
      Object.values(item).some(value => 
        String(value).toLowerCase().includes(filterText.toLowerCase())
      )
    )
    
    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1
        }
        return 0
      })
    }
    
    return filteredData
  }, [data, filterText, sortConfig])
  
  // 排序函数
  const requestSort = useCallback((key) => {
    let direction = 'ascending'
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending'
    }
    setSortConfig({ key, direction })
  }, [sortConfig])
  
  // 表头组件
  const TableHeader = useMemo(() => (
    <div className="table-header">
      {Object.keys(data[0] || {}).map(key => (
        <div 
          key={key}
          className="header-cell"
          onClick={() => requestSort(key)}
        >
          {key}
          {sortConfig.key === key && (
            <span>{sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'}</span>
          )}
        </div>
      ))}
    </div>
  ), [data, requestSort, sortConfig])
  
  // 行渲染函数
  const Row = useCallback(({ index, style }) => (
    <div style={style} className="table-row">
      {Object.values(processedData[index]).map((value, i) => (
        <div key={i} className="table-cell">
          {value}
        </div>
      ))}
    </div>
  ), [processedData])
  
  return (
    <div className="data-table">
      <input
        type="text"
        placeholder="Filter..."
        value={filterText}
        onChange={e => setFilterText(e.target.value)}
        className="filter-input"
      />
      
      {TableHeader}
      
      <List
        height={500}
        itemCount={processedData.length}
        itemSize={35}
        width="100%"
      >
        {Row}
      </List>
    </div>
  )
}
\`\`\`

### 无限滚动列表

\`\`\`jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react'

function InfiniteScrollList({ fetchData, renderItem }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [error, setError] = useState(null)
  
  // 加载数据
  const loadMoreData = useCallback(async () => {
    if (loading || !hasMore) return
    
    setLoading(true)
    setError(null)
    
    try {
      const newItems = await fetchData(page)
      
      if (newItems.length === 0) {
        setHasMore(false)
      } else {
        setItems(prevItems => [...prevItems, ...newItems])
        setPage(prevPage => prevPage + 1)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [fetchData, page, loading, hasMore])
  
  // 初始加载
  useEffect(() => {
    loadMoreData()
  }, []) // 只在组件挂载时执行一次
  
  // 滚动事件处理
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 500
      ) {
        loadMoreData()
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadMoreData])
  
  // 渲染列表项
  const renderedItems = useMemo(() => 
    items.map((item, index) => renderItem(item, index))
  , [items, renderItem])
  
  return (
    <div className="infinite-scroll-list">
      {renderedItems}
      
      {loading && <div className="loading-indicator">Loading...</div>}
      
      {error && <div className="error-message">Error: {error}</div>}
      
      {!hasMore && items.length > 0 && (
        <div className="end-message">No more items to load</div>
      )}
    </div>
  )
}

// 使用示例
function App() {
  const fetchUsers = async (page) => {
    const response = await fetch(\`/api/users?page=\${page}&limit=20\`)
    return response.json()
  }
  
  const renderUser = (user, index) => (
    <div key={user.id} className="user-item">
      <img src={user.avatar} alt={user.name} className="user-avatar" />
      <div className="user-info">
        <h3>{user.name}</h3>
        <p>{user.email}</p>
      </div>
    </div>
  )
  
  return (
    <div>
      <h1>User List</h1>
      <InfiniteScrollList 
        fetchData={fetchUsers} 
        renderItem={renderUser} 
      />
    </div>
  )
}
\`\`\`

## 总结

React性能优化是一个多方面的过程，涉及组件渲染、代码分割、内存管理和构建优化等多个层面。通过本文介绍的技术和最佳实践，你可以：

1. **优化组件渲染**：使用React.memo、useMemo和useCallback避免不必要的重新渲染
2. **优化列表渲染**：实现虚拟滚动和正确的key使用
3. **实现代码分割**：使用动态导入和懒加载减少初始加载体积
4. **预防内存泄漏**：正确清理副作用和取消异步操作
5. **优化资源加载**：实现图片懒加载和响应式加载
6. **监控性能**：使用性能工具和分析API识别瓶颈

记住，性能优化应该基于实际测量，而不是假设。在实施优化前，先使用React DevTools Profiler和其他性能工具识别真正的瓶颈，然后有针对性地进行优化。

通过这些优化技术，你可以构建出响应迅速、用户体验良好的高性能React应用。`;export{n as default};
//# sourceMappingURL=20-BHg1ehW_.js.map
