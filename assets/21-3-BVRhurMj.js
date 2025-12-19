const n=`---
title: "React服务端渲染与Next.js深度解析（三）：样式优化与部署"
excerpt: "深入探讨Next.js的样式优化、图片优化、构建配置、性能监控和实际应用案例，帮助开发者全面掌握Next.js的高级特性和最佳实践"
coverImage: "/assets/blog/dynamic-routing/cover.jpg"
date: "2025-10-29"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/dynamic-routing/cover.jpg"
---

# React服务端渲染与Next.js深度解析（三）：样式优化与部署

## 前言

在上一篇文章中，我们了解了Next.js的数据获取方法和路由系统。本文将继续深入探讨Next.js的样式优化、图片优化、构建配置、性能监控和实际应用案例，帮助你全面掌握Next.js的高级特性和最佳实践。

## Next.js样式与优化

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

\`\`\`tsx
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

Next.js为React应用提供了强大的服务端渲染能力，通过这三篇文章的介绍，我们全面了解了：

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

通过Next.js，你可以构建出高性能、SEO友好且用户体验优秀的React应用。无论是博客、电商网站还是企业应用，Next.js都能提供合适的解决方案。掌握Next.js的高级特性和最佳实践，将使你在现代Web开发中具备更强的竞争力。`;export{n as default};
//# sourceMappingURL=21-3-BVRhurMj.js.map
