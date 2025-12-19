const n=`---
title: "React服务端渲染与Next.js深度解析（二）：数据获取与路由系统"
excerpt: "深入探讨Next.js的数据获取方法、路由系统和API路由，帮助开发者掌握Next.js的核心功能，构建全栈React应用"
coverImage: "/assets/blog/hello-world/cover.jpg"
date: "2025-10-28"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/dynamic-routing/cover.jpg"
---

# React服务端渲染与Next.js深度解析（二）：数据获取与路由系统

## 前言

在上一篇文章中，我们了解了React服务端渲染的基础知识和Next.js的入门方法。本文将继续深入探讨Next.js的数据获取方法、路由系统和API路由，帮助你掌握Next.js的核心功能，构建全栈React应用。

## Next.js数据获取方法

### 客户端数据获取

使用SWR或React Query在客户端获取数据：

\`\`\`tsx
// pages/profile.tsx
import useSWR from 'swr'

// fetcher函数
const fetcher = (url: string) => fetch(url).then(res => res.json())

function Profile() {
  // 使用SWR获取数据
  const { data, error, isLoading } = useSWR('/api/user', fetcher)
  
  if (error) return <div>Failed to load</div>
  if (isLoading) return <div>Loading...</div>
  
  return (
    <div>
      <h1>{data.name}</h1>
      <p>Email: {data.email}</p>
    </div>
  )
}

export default Profile

// 使用React Query
import { useQuery } from '@tanstack/react-query'

function ProfileWithReactQuery() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => fetch('/api/user').then(res => res.json())
  })
  
  if (error) return <div>Failed to load</div>
  if (isLoading) return <div>Loading...</div>
  
  return (
    <div>
      <h1>{data.name}</h1>
      <p>Email: {data.email}</p>
    </div>
  )
}
\`\`\`

## Next.js路由系统

### 基本路由

\`\`\`tsx
// pages/index.tsx - 首页 (/)
export default function HomePage() {
  return <h1>Home Page</h1>
}

// pages/about.tsx - 关于页面 (/about)
export default function AboutPage() {
  return <h1>About Page</h1>
}

// pages/blog/index.tsx - 博客列表页 (/blog)
export default function BlogListPage() {
  return <h1>Blog List</h1>
}

// pages/blog/[slug].tsx - 动态博客页面 (/blog/my-first-post)
import { useRouter } from 'next/router'

export default function BlogPostPage() {
  const router = useRouter()
  const { slug } = router.query
  
  return <h1>Blog Post: {slug}</h1>
}
\`\`\`

### 动态路由与捕获所有路由

\`\`\`tsx
// pages/docs/[...slug].tsx - 捕获所有路由 (/docs/getting-started/installation)
import { useRouter } from 'next/router'

export default function DocPage() {
  const router = useRouter()
  const { slug } = router.query // slug = ['getting-started', 'installation']
  
  return (
    <div>
      <h1>Documentation</h1>
      <p>Path: {slug?.join('/')}</p>
    </div>
  )
}

// pages/shop/[category]/[item].tsx - 多级动态路由
export default function ShopItemPage() {
  const router = useRouter()
  const { category, item } = router.query
  
  return (
    <div>
      <h1>{item}</h1>
      <p>Category: {category}</p>
    </div>
  )
}
\`\`\`

### 路由导航

\`\`\`tsx
// 使用Link组件进行客户端导航
import Link from 'next/link'

function Navigation() {
  return (
    <nav>
      <Link href="/">
        <a>Home</a>
      </Link>
      <Link href="/about">
        <a>About</a>
      </Link>
      <Link href="/blog/my-first-post">
        <a>Blog Post</a>
      </Link>
      
      {/* 动态路由 */}
      <Link href={\`/docs/\${docPath}\`}>
        <a>Documentation</a>
      </Link>
    </nav>
  )
}

// 使用useRouter进行程序化导航
import { useRouter } from 'next/router'

function LoginForm() {
  const router = useRouter()
  
  const handleSubmit = async (event) => {
    event.preventDefault()
    
    // 登录逻辑...
    
    // 登录成功后重定向
    router.push('/dashboard')
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* 表单字段 */}
      <button type="submit">Login</button>
    </form>
  )
}

// 路由参数
function PostPage() {
  const router = useRouter()
  const { id } = router.query
  
  return <div>Post ID: {id}</div>
}
\`\`\`

## Next.js API路由

### 基本API路由

\`\`\`ts
// pages/api/hello.ts - API路由 (/api/hello)
import type { NextApiRequest, NextApiResponse } from 'next'

type ResponseData = {
  message: string
  timestamp: string
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // 处理不同的HTTP方法
  switch (req.method) {
    case 'GET':
      // GET请求处理
      res.status(200).json({
        message: 'Hello from Next.js API!',
        timestamp: new Date().toISOString()
      })
      break
      
    case 'POST':
      // POST请求处理
      const { name } = req.body
      
      if (!name) {
        return res.status(400).json({ 
          message: 'Name is required',
          timestamp: new Date().toISOString()
        })
      }
      
      res.status(201).json({
        message: \`Hello, \${name}!\`,
        timestamp: new Date().toISOString()
      })
      break
      
    default:
      // 不支持的方法
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).json({
        message: \`Method \${req.method} Not Allowed\`,
        timestamp: new Date().toISOString()
      })
  }
}
\`\`\`

### 动态API路由

\`\`\`ts
// pages/api/users/[id].ts - 动态API路由 (/api/users/123)
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query
  
  // 根据HTTP方法处理请求
  switch (req.method) {
    case 'GET':
      // 获取用户信息
      try {
        const user = await getUserById(id as string)
        
        if (!user) {
          return res.status(404).json({ message: 'User not found' })
        }
        
        res.status(200).json(user)
      } catch (error) {
        res.status(500).json({ message: 'Internal server error' })
      }
      break
      
    case 'PUT':
      // 更新用户信息
      try {
        const updatedUser = await updateUser(id as string, req.body)
        res.status(200).json(updatedUser)
      } catch (error) {
        res.status(500).json({ message: 'Internal server error' })
      }
      break
      
    case 'DELETE':
      // 删除用户
      try {
        await deleteUser(id as string)
        res.status(204).end()
      } catch (error) {
        res.status(500).json({ message: 'Internal server error' })
      }
      break
      
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
      res.status(405).json({ message: \`Method \${req.method} Not Allowed\` })
  }
}

// 模拟数据库操作
async function getUserById(id: string) {
  // 实际应用中，这里会查询数据库
  return { id, name: 'John Doe', email: 'john@example.com' }
}

async function updateUser(id: string, data: any) {
  // 实际应用中，这里会更新数据库
  return { id, ...data }
}

async function deleteUser(id: string) {
  // 实际应用中，这里会从数据库删除用户
  return true
}
\`\`\`

### 中间件

\`\`\`ts
// middleware.ts - 全局中间件
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // 获取请求路径
  const path = request.nextUrl.pathname
  
  // 检查认证状态
  const token = request.cookies.get('auth_token')?.value
  
  // 保护需要认证的路由
  if (path.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // 添加自定义头
  const response = NextResponse.next()
  response.headers.set('x-custom-header', 'custom-value')
  
  return response
}

// 配置中间件匹配的路径
export const config = {
  matcher: ['/dashboard/:path*', '/api/protected/:path*']
}
\`\`\`

## Next.js样式与优化

### CSS模块

\`\`\`tsx
// components/Button.module.css
.button {
  padding: 10px 20px;
  border-radius: 5px;
  font-weight: bold;
  transition: background-color 0.2s;
}

.primary {
  background-color: blue;
  color: white;
}

.primary:hover {
  background-color: darkblue;
}

.secondary {
  background-color: gray;
  color: white;
}

// components/Button.tsx
import styles from './Button.module.css'

type ButtonProps = {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
  onClick?: () => void
}

export default function Button({ variant = 'primary', children, onClick }: ButtonProps) {
  return (
    <button 
      className={\`\${styles.button} \${styles[variant]}\`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
\`\`\`

### 全局样式

\`\`\`css
/* styles/globals.css */
/* 全局样式 */
html,
body {
  padding: 0;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
}

a {
  color: inherit;
  text-decoration: none;
}

/* 响应式设计 */
@media (prefers-color-scheme: dark) {
  html {
    color-scheme: dark;
  }
  body {
    color: white;
    background: black;
  }
}
\`\`\`

## 总结

在本篇文章中，我们深入了解了Next.js的数据获取方法（包括客户端数据获取、SWR和React Query的使用）、路由系统（基本路由、动态路由和路由导航）以及API路由的创建和使用。这些功能是Next.js的核心特性，能够帮助开发者构建功能强大的全栈React应用。

在下一篇文章中，我们将继续探讨Next.js的样式优化、图片优化、构建配置和实际应用案例，帮助你全面掌握Next.js的高级特性和最佳实践。

`;export{n as default};
//# sourceMappingURL=21-2-CvXNL5YQ.js.map
