const n=`---
title: "React服务端渲染与Next.js深度解析"
excerpt: "深入探讨React服务端渲染的原理、Next.js的核心特性以及最佳实践，帮助开发者构建高性能、SEO友好的React应用"
coverImage: "/assets/blog/preview/cover.jpg"
date: "2025-10-30"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/dynamic-routing/cover.jpg"
---

# React服务端渲染与Next.js深度解析

## 前言

随着前端应用复杂度的增加，客户端渲染(CSR)面临首屏加载慢、SEO不友好等问题。服务端渲染(SSR)通过在服务器上生成初始HTML，有效解决了这些问题。Next.js作为React生态中最流行的SSR框架，提供了完整的解决方案。本文将深入探讨React服务端渲染的原理、Next.js的核心特性以及最佳实践，帮助你构建高性能、SEO友好的React应用。

## 服务端渲染基础

### 客户端渲染 vs 服务端渲染

#### 客户端渲染(CSR)

\`\`\`jsx
// 客户端渲染流程
// 1. 服务器返回空HTML
// 2. 浏览器下载JavaScript
// 3. JavaScript执行，渲染页面

// 传统React应用示例
import React from 'react'
import { createRoot } from 'react-dom/client'

function App() {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => setData(data))
  }, [])
  
  return (
    <div>
      <h1>My App</h1>
      {data ? <div>{data.content}</div> : <div>Loading...</div>}
    </div>
  )
}

// 客户端渲染的HTML输出
// <!DOCTYPE html>
// <html>
//   <head>
//     <title>My App</title>
//     <script src="bundle.js"><\/script>
//   </head>
//   <body>
//     <div id="root"></div>
//   </body>
// </html>
\`\`\`

#### 服务端渲染(SSR)

\`\`\`jsx
// 服务端渲染流程
// 1. 服务器执行React代码，生成HTML
// 2. 服务器返回完整HTML
// 3. 浏览器显示内容，同时下载JavaScript
// 4. JavaScript执行，添加交互功能

// 服务端渲染示例
import express from 'express'
import React from 'react'
import { renderToString } from 'react-dom/server'
import App from './App'

const app = express()

app.get('/', (req, res) => {
  // 在服务器上获取数据
  return fetch('http://api.example.com/data')
    .then(res => res.json())
    .then(data => {
      // 渲染React组件为HTML字符串
      const html = renderToString(<App data={data} />)
      
      // 发送完整HTML
      res.send(\`
        <!DOCTYPE html>
        <html>
          <head>
            <title>My App</title>
          </head>
          <body>
            <div id="root">\${html}</div>
            <script>
              window.__INITIAL_DATA__ = \${JSON.stringify(data)}
            <\/script>
            <script src="bundle.js"><\/script>
          </body>
        </html>
      \`)
    })
})

app.listen(3000)

// 客户端hydration
import React, { useState, useEffect } from 'react'
import { hydrateRoot } from 'react-dom/client'

function App({ data: initialData }) {
  const [data, setData] = useState(initialData)
  
  useEffect(() => {
    // 如果没有初始数据，从API获取
    if (!data) {
      fetch('/api/data')
        .then(res => res.json())
        .then(data => setData(data))
    }
  }, [data])
  
  return (
    <div>
      <h1>My App</h1>
      {data ? <div>{data.content}</div> : <div>Loading...</div>}
    </div>
  )
}

// 获取服务器传递的初始数据
const initialData = window.__INITIAL_DATA__

// Hydration使服务器渲染的HTML具有交互性
hydrateRoot(
  document.getElementById('root'),
  <App data={initialData} />
)
\`\`\`

### SSR的优势与挑战

#### 优势

1. **更快的首屏加载**：服务器返回完整HTML，浏览器可以立即显示内容
2. **更好的SEO**：搜索引擎可以直接抓取页面内容
3. **更好的性能**：减少客户端JavaScript执行时间
4. **更好的用户体验**：减少白屏时间

#### 挑战

1. **服务器负载增加**：每个请求都需要在服务器上渲染React组件
2. **开发复杂性**：需要处理服务器和客户端环境差异
3. **状态管理**：需要在服务器和客户端之间同步状态
4. **生命周期差异**：某些生命周期只在客户端执行

## Next.js基础

### Next.js简介

Next.js是一个基于React的全栈框架，提供了：

- 服务端渲染(SSR)
- 静态站点生成(SSG)
- API路由
- 自动代码分割
- 图片优化
- 内置CSS支持
- TypeScript支持

### 创建Next.js应用

\`\`\`bash
# 创建Next.js应用
npx create-next-app@latest my-app

# 或使用TypeScript模板
npx create-next-app@latest my-app --typescript

# 项目结构
my-app/
├── pages/              # 页面组件
│   ├── _app.tsx       # App组件
│   ├── _document.tsx  # Document组件
│   └── index.tsx      # 首页
├── public/            # 静态资源
├── styles/            # 样式文件
└── package.json
\`\`\`

### 基本页面组件

\`\`\`tsx
// pages/index.tsx
import { GetServerSideProps } from 'next'
import { NextPage } from 'next'
import Head from 'next/head'

type HomeProps = {
  data: {
    title: string
    content: string
  }
}

const Home: NextPage<HomeProps> = ({ data }) => {
  return (
    <div>
      <Head>
        <title>{data.title}</title>
        <meta name="description" content={data.content} />
      </Head>
      
      <main>
        <h1>{data.title}</h1>
        <p>{data.content}</p>
      </main>
    </div>
  )
}

// 服务端渲染数据获取
export const getServerSideProps: GetServerSideProps<HomeProps> = async (context) => {
  // 从API获取数据
  const res = await fetch('https://api.example.com/data')
  const data = await res.json()
  
  // 返回props给页面组件
  return {
    props: {
      data
    }
  }
}

export default Home
\`\`\`

## Next.js数据获取方法

### getServerSideProps (SSR)

在每次请求时在服务器上运行：

\`\`\`tsx
// pages/posts/[id].tsx
import { GetServerSideProps } from 'next'
import { NextPage } from 'next'

type PostProps = {
  post: {
    id: number
    title: string
    content: string
    author: string
  }
}

const Post: NextPage<PostProps> = ({ post }) => {
  return (
    <div>
      <h1>{post.title}</h1>
      <p>By {post.author}</p>
      <div>{post.content}</div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps<PostProps> = async (context) => {
  const { id } = context.params
  
  // 从API获取数据
  const res = await fetch(\`https://api.example.com/posts/\${id}\`)
  const post = await res.json()
  
  // 如果文章不存在，返回404
  if (!post) {
    return {
      notFound: true
    }
  }
  
  return {
    props: {
      post
    }
  }
}

export default Post
\`\`\`

### getStaticProps (SSG)

在构建时运行，生成静态HTML：

\`\`\`tsx
// pages/about.tsx
import { GetStaticProps } from 'next'
import { NextPage } from 'next'

type AboutProps = {
  companyInfo: {
    name: string
    description: string
    founded: number
  }
}

const About: NextPage<AboutProps> = ({ companyInfo }) => {
  return (
    <div>
      <h1>About {companyInfo.name}</h1>
      <p>{companyInfo.description}</p>
      <p>Founded in {companyInfo.founded}</p>
    </div>
  )
}

export const getStaticProps: GetStaticProps<AboutProps> = async () => {
  // 在构建时获取数据
  const res = await fetch('https://api.example.com/company')
  const companyInfo = await res.json()
  
  return {
    props: {
      companyInfo
    },
    // 重新生成页面的时间（秒）
    revalidate: 60 // 60秒后重新生成
  }
}

export default About
\`\`\`

### getStaticPaths

为动态路由指定静态生成的路径：

\`\`\`tsx
// pages/posts/[id].tsx
import { GetStaticPaths, GetStaticProps } from 'next'
import { NextPage } from 'next'

type PostProps = {
  post: {
    id: number
    title: string
    content: string
  }
}

const Post: NextPage<PostProps> = ({ post }) => {
  return (
    <div>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </div>
  )
}

// 指定哪些路径需要静态生成
export const getStaticPaths: GetStaticPaths = async () => {
  // 获取所有文章ID
  const res = await fetch('https://api.example.com/posts')
  const posts = await res.json()
  
  // 生成路径
  const paths = posts.map((post: { id: number }) => ({
    params: { id: post.id.toString() }
  }))
  
  return {
    paths,
    fallback: 'blocking' // 'blocking' | true | false
  }
}

export const getStaticProps: GetStaticProps<PostProps> = async ({ params }) => {
  const { id } = params
  
  // 获取特定文章数据
  const res = await fetch(\`https://api.example.com/posts/\${id}\`)
  const post = await res.json()
  
  return {
    props: {
      post
    },
    // 重新生成页面的时间
    revalidate: 3600 // 1小时
  }
}

export default Post
\`\`\`

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
// styles/globals.css
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

// pages/_app.tsx - 导入全局样式
import '../styles/globals.css'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
\`\`\`

### 图片优化

\`\`\`tsx
// components/OptimizedImage.tsx
import Image from 'next/image'

type OptimizedImageProps = {
  src: string
  alt: string
  width: number
  height: number
  priority?: boolean
}

export default function OptimizedImage({ 
  src, 
  alt, 
  width, 
  height, 
  priority = false 
}: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority} // 优先加载重要图片
      placeholder="blur" // 加载时显示模糊占位符
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    />
  )
}

// 使用示例
function ProductCard({ product }) {
  return (
    <div>
      <OptimizedImage
        src={product.image}
        alt={product.name}
        width={300}
        height={200}
        priority={product.featured}
      />
      <h3>{product.name}</h3>
      <p>{product.price}</p>
    </div>
  )
}
\`\`\`

## Next.js部署与优化

### 构建优化

\`\`\`json
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用实验性功能
  experimental: {
    // 启用App Router (Next.js 13+)
    appDir: true,
    // 优化服务器组件
    serverComponentsExternalPackages: ['some-package']
  },
  
  // 图片优化配置
  images: {
    domains: ['example.com', 'cdn.example.com'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  },
  
  // 压缩配置
  compress: true,
  
  // PWA配置
  pwa: {
    dest: 'public',
    disable: process.env.NODE_ENV === 'development'
  },
  
  // 环境变量
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY
  },
  
  // 重定向
  async redirects() {
    return [
      {
        source: '/old-path',
        destination: '/new-path',
        permanent: true
      }
    ]
  },
  
  // 重写
  async rewrites() {
    return [
      {
        source: '/api/blog/:path*',
        destination: 'https://external-api.com/blog/:path*'
      }
    ]
  },
  
  // 头部配置
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' }
        ]
      }
    ]
  },
  
  // Webpack配置
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 自定义Webpack配置
    return config
  }
}

module.exports = nextConfig
\`\`\`

### 性能监控

\`\`\`tsx
// components/PerformanceMonitor.tsx
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function PerformanceMonitor() {
  const router = useRouter()
  
  useEffect(() => {
    // 监控路由变化
    const handleRouteChange = (url: string) => {
      // 记录页面访问
      if (window.gtag) {
        window.gtag('config', 'GA_MEASUREMENT_ID', {
          page_path: url,
        })
      }
      
      // 记录性能指标
      if (window.performance) {
        const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        const loadTime = navigation.loadEventEnd - navigation.fetchStart
        
        // 发送性能数据
        if (window.gtag) {
          window.gtag('event', 'page_load_time', {
            value: Math.round(loadTime),
            custom_map: { custom_parameter_1: 'page_load_time' }
          })
        }
      }
    }
    
    router.events.on('routeChangeComplete', handleRouteChange)
    
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])
  
  return null
}

// pages/_app.tsx - 使用性能监控
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import PerformanceMonitor from '../components/PerformanceMonitor'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <PerformanceMonitor />
      <Component {...pageProps} />
    </>
  )
}
\`\`\`

## 实际应用案例

### 电商网站

\`\`\`tsx
// pages/products/[slug].tsx - 产品详情页
import { GetStaticProps, GetStaticPaths } from 'next'
import { GetProductBySlug, GetAllProductSlugs } from '../../lib/products'
import Image from 'next/image'
import { useState } from 'react'
import { useCart } from '../../context/CartContext'

type ProductProps = {
  product: {
    id: string
    slug: string
    name: string
    description: string
    price: number
    images: string[]
    inStock: boolean
  }
}

export default function ProductPage({ product }: ProductProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const { addToCart } = useCart()
  
  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity
    })
  }
  
  return (
    <div className="product-page">
      <div className="product-images">
        <div className="main-image">
          <Image
            src={product.images[selectedImage]}
            alt={product.name}
            width={600}
            height={600}
            priority
          />
        </div>
        <div className="image-thumbnails">
          {product.images.map((image, index) => (
            <button
              key={index}
              className={index === selectedImage ? 'active' : ''}
              onClick={() => setSelectedImage(index)}
            >
              <Image
                src={image}
                alt={\`\${product.name} \${index + 1}\`}
                width={100}
                height={100}
              />
            </button>
          ))}
        </div>
      </div>
      
      <div className="product-info">
        <h1>{product.name}</h1>
        <p className="price">\${product.price.toFixed(2)}</p>
        <p className="description">{product.description}</p>
        
        {product.inStock ? (
          <div className="purchase-options">
            <div className="quantity-selector">
              <label>Quantity:</label>
              <select 
                value={quantity} 
                onChange={(e) => setQuantity(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
            
            <button 
              className="add-to-cart-btn"
              onClick={handleAddToCart}
            >
              Add to Cart
            </button>
          </div>
        ) : (
          <p className="out-of-stock">Out of Stock</p>
        )}
      </div>
    </div>
  )
}

// 静态生成所有产品页面
export async function getStaticPaths() {
  const slugs = await GetAllProductSlugs()
  
  const paths = slugs.map(slug => ({
    params: { slug }
  }))
  
  return {
    paths,
    fallback: 'blocking' // 新产品可以按需生成
  }
}

// 获取产品数据
export async function getStaticProps({ params }) {
  const product = await GetProductBySlug(params.slug)
  
  if (!product) {
    return { notFound: true }
  }
  
  return {
    props: {
      product
    },
    revalidate: 3600 // 每小时重新生成
  }
}
\`\`\`

### 博客系统

\`\`\`tsx
// pages/blog/index.tsx - 博客列表页
import { GetStaticProps } from 'next'
import { GetAllPosts, GetPaginatedPosts } from '../../lib/posts'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

type BlogProps = {
  initialPosts: {
    id: string
    title: string
    excerpt: string
    publishedAt: string
    slug: string
  }[]
  totalPages: number
}

export default function Blog({ initialPosts, totalPages }: BlogProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const router = useRouter()
  
  // 加载更多文章
  const loadMorePosts = async () => {
    setLoading(true)
    const nextPage = page + 1
    
    try {
      const newPosts = await GetPaginatedPosts(nextPage)
      setPosts([...posts, ...newPosts])
      setPage(nextPage)
      
      // 更新URL但不刷新页面
      router.push(\`/blog?page=\${nextPage}\`, undefined, { shallow: true })
    } catch (error) {
      console.error('Error loading more posts:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="blog-container">
      <h1>Blog</h1>
      
      <div className="posts-grid">
        {posts.map(post => (
          <div key={post.id} className="post-card">
            <Link href={\`/blog/\${post.slug}\`}>
              <a>
                <h2>{post.title}</h2>
                <p>{post.excerpt}</p>
                <time>{new Date(post.publishedAt).toLocaleDateString()}</time>
              </a>
            </Link>
          </div>
        ))}
      </div>
      
      {page < totalPages && (
        <div className="load-more-container">
          <button 
            onClick={loadMorePosts} 
            disabled={loading}
            className="load-more-btn"
          >
            {loading ? 'Loading...' : 'Load More Posts'}
          </button>
        </div>
      )}
    </div>
  )
}

// 获取初始博客文章
export async function getStaticProps() {
  const posts = await GetPaginatedPosts(1)
  const totalPages = Math.ceil(await GetAllPosts().length / 6) // 每页6篇文章
  
  return {
    props: {
      initialPosts: posts,
      totalPages
    },
    revalidate: 3600 // 每小时重新生成
  }
}
\`\`\`

## 总结

Next.js为React应用提供了强大的服务端渲染能力，通过本文的介绍，我们了解了：

1. **SSR与SSG的区别**：SSR在请求时渲染，SSG在构建时渲染
2. **数据获取方法**：getServerSideProps、getStaticProps和getStaticPaths
3. **路由系统**：基本路由、动态路由和捕获所有路由
4. **API路由**：构建全栈应用的能力
5. **样式与优化**：CSS模块、图片优化和构建配置
6. **实际应用**：电商网站和博客系统的实现

Next.js的选择取决于你的应用需求：

- **内容驱动网站**：使用SSG获得最佳性能
- **个性化内容**：使用SSR提供动态内容
- **混合应用**：结合SSR和SSG，根据页面特性选择合适的渲染方式

通过Next.js，你可以构建出高性能、SEO友好且用户体验优秀的React应用。无论是博客、电商网站还是企业应用，Next.js都能提供合适的解决方案。`;export{n as default};
//# sourceMappingURL=21-CkWfG34o.js.map
