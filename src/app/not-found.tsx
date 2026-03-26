import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-gray-700 mb-6">页面未找到</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          抱歉，您要访问的页面不存在。可能是链接已失效或输入的地址有误。
        </p>
        <Link 
          href="/" 
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors duration-300"
        >
          返回首页
        </Link>
      </div>
    </div>
  )
} 
