'use client';

import { useEffect, useState } from 'react';
import clarity from '@microsoft/clarity';

export default function ClarityTest() {
  const [status, setStatus] = useState<string>('检查中...');
  const [projectId, setProjectId] = useState<string>('');

  useEffect(() => {
    // 获取环境变量中的项目 ID
    const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;
    setProjectId(clarityId || '未设置');

    if (!clarityId) {
      setStatus('❌ 错误：未设置 NEXT_PUBLIC_CLARITY_ID 环境变量');
      return;
    }

    if (clarityId === 'test_project_id') {
      setStatus('⚠️ 警告：使用的是测试项目 ID，请设置真实的 Clarity 项目 ID');
      return;
    }

    // 测试 Clarity 是否可用
    try {
      if (typeof window !== 'undefined' && clarity) {
        // 尝试初始化 Clarity
        clarity.init(clarityId);
        
        // 设置测试标签
        clarity.setTag('test_mode', 'true');
        clarity.setTag('test_timestamp', new Date().toISOString());
        
        // 发送测试事件
        clarity.event('clarity_test_initialization');
        
        setStatus('✅ Clarity 初始化成功！');
        
        // 3秒后检查是否真的连接成功
        setTimeout(() => {
          setStatus('✅ Clarity 连接测试完成！请检查 Clarity 仪表板');
        }, 3000);
      } else {
        setStatus('❌ 错误：Clarity 库未正确加载');
      }
    } catch (error) {
      setStatus(`❌ 错误：Clarity 初始化失败 - ${error}`);
    }
  }, []);

  const testEvent = () => {
    try {
      console.log('🔄 准备发送测试事件...');
      clarity.event('test_button_click');
      console.log('✅ 测试事件已发送: test_button_click');
      alert('测试事件已发送！请检查 Clarity 仪表板和控制台');
    } catch (error) {
      console.error('❌ 发送测试事件失败:', error);
      alert(`发送测试事件失败：${error}`);
    }
  };

  const testTag = () => {
    try {
      console.log('🔄 准备设置测试标签...');
      clarity.setTag('test_tag', 'test_value');
      console.log('✅ 测试标签已设置: test_tag = test_value');
      alert('测试标签已设置！请检查控制台');
    } catch (error) {
      console.error('❌ 设置测试标签失败:', error);
      alert(`设置测试标签失败：${error}`);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Clarity 连通性测试</h2>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">状态信息</h3>
          <p className="text-sm text-gray-600 mb-2">
            <strong>项目 ID:</strong> {projectId}
          </p>
          <p className="text-sm text-gray-600 mb-2">
            <strong>状态:</strong> {status}
          </p>
        </div>

        <div className="p-4 bg-blue-50 rounded">
          <h3 className="font-semibold mb-2">测试操作</h3>
          <div className="flex gap-2">
            <button
              onClick={testEvent}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              发送测试事件
            </button>
            <button
              onClick={testTag}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              设置测试标签
            </button>
          </div>
        </div>

        <div className="p-4 bg-yellow-50 rounded">
          <h3 className="font-semibold mb-2">下一步操作</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
            <li>访问 <a href="https://clarity.microsoft.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Microsoft Clarity</a> 创建项目</li>
            <li>复制项目 ID 到 <code className="bg-gray-200 px-1 rounded">.env.local</code> 文件</li>
            <li>重启开发服务器</li>
            <li>刷新此页面重新测试</li>
          </ol>
        </div>

        <div className="p-4 bg-green-50 rounded">
          <h3 className="font-semibold mb-2">验证方法</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>打开浏览器开发者工具的控制台</li>
            <li>查看是否有 &quot;Clarity initialized successfully&quot; 消息</li>
            <li>在 Clarity 仪表板中查看是否有新的会话数据</li>
            <li>检查是否有测试事件和标签记录</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
