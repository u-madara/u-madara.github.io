const n=`---
title: "React服务端渲染与Next.js深度解析（一）：服务端渲染基础与Next.js入门"
excerpt: "深入探讨React服务端渲染的原理、Next.js的基础特性以及入门实践，帮助开发者理解SSR与CSR的区别以及Next.js的基本使用方法"
coverImage: "/assets/blog/preview/cover.jpg"
date: "2025-10-27"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/dynamic-routing/cover.jpg"
---

# React服务端渲染与Next.js深度解析（一）：服务端渲染基础与Next.js入门

## 前言

随着前端应用复杂度的增加，客户端渲染(CSR)面临首屏加载慢、SEO不友好等问题。服务端渲染(SSR)通过在服务器上生成初始HTML，有效解决了这些问题。Next.js作为React生态中最流行的SSR框架，提供了完整的解决方案。本文将深入探讨React服务端渲染的原理、Next.js的基础特性以及入门实践，帮助你理解SSR与CSR的区别以及Next.js的基本使用方法。

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

## 总结

在本篇文章中，我们深入了解了服务端渲染(SSR)与客户端渲染(CSR)的区别，以及SSR的优势与挑战。同时，我们也介绍了Next.js的基础知识和三种主要的数据获取方法：getServerSideProps、getStaticProps和getStaticPaths。

在下一篇文章中，我们将继续探讨Next.js的路由系统和API路由，帮助你更全面地掌握Next.js的使用方法。

`;export{n as default};
//# sourceMappingURL=21-1-Cs5YPu54.js.map
