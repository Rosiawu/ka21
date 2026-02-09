"use client"; // 标记为客户端组件，可以使用浏览器API和状态管理

// 引入React相关Hook和组件
import { useState, useRef, useEffect, Suspense, lazy } from 'react'; // React核心Hook
import type { HTMLAttributes } from 'react'; // React HTML属性类型
import { useMediaQuery } from '@/hooks/useMediaQuery'; // 响应式媒体查询Hook
import toolsData from '@/data/tools.json'; // 工具数据JSON文件
import { tutorials } from '@/data/tutorials'; // 教程数据

// 动态导入 react-markdown 以减少初始包大小
const ReactMarkdown = lazy(() => import('react-markdown'));

// ========== 配置常量 ==========

// AI助手功能开关 - 通过环境变量控制是否启用
const AI_ASSISTANT_ENABLED = process.env.NEXT_PUBLIC_ENABLE_AI_ASSISTANT === 'true'; // AI助手功能开关

// 优先使用环境变量，兼容保留原有常量以不影响现有功能
const API_KEY = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || 'sk-25ae8e061fe242849b93308abc2fc22f'; // DeepSeek API密钥
const API_URL = process.env.NEXT_PUBLIC_DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions'; // DeepSeek API接口地址

// ========== 类型定义 ==========

// 工具接口定义
interface Tool {
  name: string; // 工具名称
  description: string; // 工具描述
  url: string; // 工具链接
  tags?: string[]; // 工具标签数组
  relatedArticles?: RelatedArticle[]; // 相关文章数组
  groupComments?: GroupComment[]; // 群友点评数组
  id: string; // 工具唯一标识
}

// 相关文章接口定义
interface RelatedArticle {
  title: string; // 文章标题
  url: string; // 文章链接
}

// 群友点评接口定义
interface GroupComment {
  content: string; // 点评内容
}

// 聊天API响应接口定义
interface ChatResponse {
  choices: Array<{ // 选择数组
    message: { // 消息对象
      content: string; // 消息内容
    };
  }>;
}

// ========== 工具函数 ==========

/**
 * 简化版工具搜索函数
 * 在本地工具数据中搜索匹配的工具
 *
 * @param query 搜索查询字符串
 * @returns 匹配的工具数组，最多返回5个
 */
function searchLocalTools(query: string) {
  // 转小写并去除多余空格，统一搜索格式
  const q = query.toLowerCase().trim();

  // 首先尝试完全匹配工具名称
  let exactMatch = (toolsData.tools as Tool[]).find((tool: Tool) =>
    tool.name.toLowerCase() === q // 工具名称完全匹配
  );

  // 如果没有完全匹配，尝试部分匹配
  if (!exactMatch) {
    exactMatch = (toolsData.tools as Tool[]).find((tool: Tool) =>
      tool.name.toLowerCase().includes(q) || // 工具名称包含查询词
      q.includes(tool.name.toLowerCase()) // 查询词包含工具名称
    );
  }

  // 如果仍然没有匹配，尝试通过标签匹配
  if (!exactMatch) {
    exactMatch = (toolsData.tools as Tool[]).find((tool: Tool) =>
      tool.tags && tool.tags.some((tag: string) => tag.toLowerCase() === q) // 标签完全匹配
    );
  }

  return exactMatch; // 返回匹配的工具，如果没有匹配则返回undefined
}

/**
 * 简化版查找相关教程函数
 * 根据工具ID和名称查找相关的教程
 *
 * @param toolId 工具唯一标识
 * @param toolName 工具名称
 * @returns 相关教程数组，最多返回3个
 */
function findRelatedTutorials(toolId: string, toolName: string) {
  return tutorials.filter(tutorial =>
    // 直接关联到工具
    (tutorial.relatedTools && tutorial.relatedTools.includes(toolId)) ||
    // 标题或描述中包含工具名
    tutorial.title.toLowerCase().includes(toolName.toLowerCase()) ||
    tutorial.description.toLowerCase().includes(toolName.toLowerCase())
  ).slice(0, 3); // 最多返回3个教程
}

// ========== 聊天限制管理 ==========

/**
 * 获取今天的日期键，用于聊天次数限制
 * @returns 格式为 'chat_count_YYYY-MM-DD' 的字符串
 */
function getTodayKey() {
  return 'chat_count_' + new Date().toISOString().slice(0, 10); // 获取当前日期并格式化为YYYY-MM-DD
}

/**
 * 获取今天的聊天次数
 * @returns 今天的聊天次数
 */
function getChatCount() {
  return Number(localStorage.getItem(getTodayKey()) || '0'); // 从本地存储获取聊天次数，如果没有则返回0
}

/**
 * 增加聊天次数
 * @returns 增加后的聊天次数
 */
function incChatCount() {
  const key = getTodayKey(); // 获取今天的键
  let count = Number(localStorage.getItem(key) || '0'); // 获取当前聊天次数
  count += 1; // 增加1次
  localStorage.setItem(key, String(count)); // 保存到本地存储
}

// ========== 常量定义 ==========

// 欢迎语内容 - 添加作者查询功能提示
const WELCOME_MESSAGE = `👋 你好！我是KA21小助手

### 三种使用方式：

1. **输入工具名称**（如"即梦"、"DeepSeek"）→ 获取详细介绍和教程
2. **输入作者名称**（如"阿真"、"Loki"）→ 查看该作者的教程
3. **输入AI相关问题** → 由智能助手回答

### 热门推荐：

**🔍 热门工具**
\nDeepSeek - 强大的AI助手，提供智能搜索和知识问答
\n即梦 - 字节跳动出品的AI创作平台，支持AI绘画与视频创作
\nima - 腾讯出品的AI知识库管理平台，适合团队知识共享

**✍️ 优质作者**
\n• 阿真：AI绘画创作领域的知名自媒体作者
\n• Loki：提示词达人，AI工具测评实践经验丰富
\n• 英语好课研磨：AI辅助英语教学技巧分享

试试看：输入工具名称、作者名称或提问任何AI相关问题！`;

// ========== 作者查询功能 ==========

/**
 * 根据作者名称查找教程
 * @param authorName 作者名称
 * @returns 该作者的教程数组，最多返回6个
 */
function findTutorialsByAuthor(authorName: string) {
  // 转小写并去除多余空格，统一搜索格式
  const name = authorName.toLowerCase().trim();

  // 定义常见作者名的映射，包括各种可能的输入形式
  const authorMapping: Record<string, string[]> = {
    'loki': ['赛博小熊猫loki', '赛博小熊猫', 'loki'],
    '阿真': ['阿真lrene', '阿真', 'lrene'],
    '霏霏': ['霏霏同学', '霏霏'],
    '瓦叔': ['靠谱瓦叔ai趣探', '蜡笔', '瓦叔', '靠谱瓦叔'],
    '硅基': ['硅基seele', '硅基'],
    '威廉': ['八爪鱼威廉', '威廉', '八爪鱼'],
    '英语': ['英语好课研磨'],
    '研磨': ['英语好课研磨'],
    '数字生命': ['数字生命卡兹克', '卡兹克'],
    '职场': ['职场ai智多星'],
    '树语': ['树语牧歌'],
    '人工智能': ['人工智能怨气指南'],
    '乘风破浪': ['ai乘风破浪'],
    'simon': ['simonlin的精神世界', 'simonlin']
  };

  // 尝试查找是否匹配任何已知作者
  let matchedAuthorNames: string[] = [];
  for (const [, aliases] of Object.entries(authorMapping)) {
    if (aliases.some(alias => name.includes(alias.toLowerCase()))) {
      // 找到匹配作者，使用该作者的所有可能名称变体进行搜索
      matchedAuthorNames = aliases;
      break;
    }
  }

  // 如果没有匹配到已知作者，直接使用输入的名称
  if (matchedAuthorNames.length === 0) {
    matchedAuthorNames = [name];
  }

  // 查找匹配作者的教程
  return tutorials.filter(tutorial => {
    const author = tutorial.author.toLowerCase();
    return matchedAuthorNames.some(authorName => author.includes(authorName.toLowerCase()));
  }).slice(0, 6); // 最多返回6个教程
}

// 检测是否是作者查询
function isAuthorQuery(query: string): boolean {
  // 作者关键词模式，如"作者阿真"、"loki的教程"等
  const authorPatterns = [
    /作者(.+)/i,            // "作者阿真"
    /(.+)的教程/i,          // "阿真的教程"
    /(.+)写的/i,            // "阿真写的"
    /(.+)的文章/i,          // "阿真的文章"
    /查找(.+)的/i,          // "查找阿真的"
    /搜索(.+)的/i,          // "搜索阿真的"
    /推荐(.+)的/i,          // "推荐阿真的"
  ];

  // 直接匹配已知作者名
  const knownAuthors = [
    'loki', '赛博小熊猫', '赛博小熊猫loki',
    '阿真', 'lrene', '阿真lrene',
    '霏霏', '霏霏同学',
    '瓦叔', '蜡笔', '靠谱瓦叔', '靠谱瓦叔ai趣探',
    '硅基', '硅基seele',
    '威廉', '八爪鱼', '八爪鱼威廉',
    '英语好课研磨', '英语', '研磨',
    '数字生命卡兹克', '卡兹克', '数字生命',
    '职场ai智多星', '职场',
    '树语牧歌', '树语',
    '人工智能怨气指南',
    'ai乘风破浪', '乘风破浪',
    'simonlin的精神世界', 'simonlin'
  ];

  // 检查是否匹配作者查询模式
  for (const pattern of authorPatterns) {
    if (pattern.test(query)) {
      return true;
    }
  }

  // 检查是否直接匹配已知作者名
  const lowerQuery = query.toLowerCase();
  return knownAuthors.some(author =>
    lowerQuery === author.toLowerCase() ||
    lowerQuery.includes(author.toLowerCase())
  );
}

// 从查询中提取作者名
function extractAuthorName(query: string): string {
  // 作者关键词模式，匹配括号中的是作者名部分
  const authorPatterns = [
    /作者(.+)/i,            // "作者阿真" -> "阿真"
    /(.+)的教程/i,          // "阿真的教程" -> "阿真"
    /(.+)写的/i,            // "阿真写的" -> "阿真"
    /(.+)的文章/i,          // "阿真的文章" -> "阿真"
    /查找(.+)的/i,          // "查找阿真的" -> "阿真"
    /搜索(.+)的/i,          // "搜索阿真的" -> "阿真"
    /推荐(.+)的/i,          // "推荐阿真的" -> "阿真"
  ];

  // 检查各种模式，提取作者名
  for (const pattern of authorPatterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // 如果没有匹配到特定模式，返回原始查询
  return query;
}

// ========== 主要组件 ==========

/**
 * 聊天组件
 * - 支持工具查询、作者查询和AI问答
 * - 响应式设计，适配移动端和桌面端
 * - 限制每日聊天次数，防止滥用
 */
export default function ChatWidget() {
  // ========== 状态管理 ==========

  // UI状态
  const [open, setOpen] = useState(false); // 聊天窗口是否打开
  const [input, setInput] = useState(''); // 输入框内容
  const [loading, setLoading] = useState(false); // 是否正在加载
  const [error, setError] = useState(''); // 错误信息
  const [showWelcome, setShowWelcome] = useState(true); // 是否显示欢迎语

  // 聊天状态
  const [messages, setMessages] = useState([
    { role: 'system', content: '你是一个乐于助人的AI助手。' } // 系统消息
  ]);
  const [chatCount, setChatCount] = useState(0); // 聊天次数，初始为0，挂载后再同步

  // DOM引用
  const messagesEndRef = useRef<HTMLDivElement>(null); // 消息列表底部的引用，用于自动滚动

  // ========== 响应式设计 ==========

  // 使用媒体查询钩子检测设备类型
  const isMobile = useMediaQuery('(max-width: 767px)'); // 移动设备检测
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)'); // 平板设备检测

  // 根据设备类型计算聊天窗口尺寸
  const chatWidth = isMobile ? '90vw' : isTablet ? '400px' : '450px'; // 聊天窗口宽度
  const chatHeight = isMobile ? '75vh' : isTablet ? '520px' : '600px'; // 聊天窗口高度
  const messageBubbleWidth = isMobile ? '85%' : isTablet ? '300px' : '350px'; // 消息气泡宽度
  const inputWidth = isMobile ? '75%' : '80%'; // 输入框宽度

  // ========== 副作用处理 ==========

  // 组件挂载后同步chatCount，避免SSR访问localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') { // 确保在客户端环境
      setChatCount(getChatCount()); // 同步聊天次数
    }
  }, [open]);

  // 处理欢迎信息显示
  useEffect(() => {
    if (open && showWelcome && messages.length === 1) {
      setMessages([
        ...messages,
        { role: 'assistant', content: WELCOME_MESSAGE }
      ]);
      setShowWelcome(false);
    }
  }, [open, showWelcome, messages]);

  // 滚动到底部
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // 发送消息
  const sendMessage = async () => {
    if (!input.trim() || chatCount >= 10) return;
    setError('');
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    scrollToBottom();

    // 检查是否是作者查询
    if (isAuthorQuery(input)) {
      const authorName = extractAuthorName(input);
      const authorTutorials = findTutorialsByAuthor(authorName);

      if (authorTutorials.length > 0) {
        // 构建作者教程回复 - 优化布局格式
        let reply = `### ${authorName} 的相关教程\n\n`;

        authorTutorials.forEach((tutorial, idx) => {
          // 添加序号和标题（加粗）
          reply += `**${idx + 1}. [${tutorial.title}](${tutorial.url})**\n\n`;

          // 使用标签式样式显示分类和难度，确保每个标签占一行
          reply += `\`分类: ${tutorial.category}\`  \n`;
          reply += `\`难度: ${tutorial.difficultyLevel}\`\n\n`;

          // 添加简短描述（如果有且不同于标题）
          if (tutorial.description && tutorial.description !== tutorial.title) {
            const shortDesc = tutorial.description.length > 60 ?
              tutorial.description.substring(0, 60) + '...' :
              tutorial.description;
            reply += `${shortDesc}\n\n`;
          }

          // 添加分隔线（除了最后一个项目）
          if (idx < authorTutorials.length - 1) {
            reply += `---\n\n`;
          }
        });

        // 发送回复
        setMessages([
          ...newMessages,
          { role: 'assistant', content: reply }
        ]);
        setLoading(false);
        incChatCount();
        setChatCount(getChatCount());
        scrollToBottom();
        return;
      } else {
        // 未找到匹配的教程，给出友好提示
        const reply = `### 未找到 "${authorName}" 的相关教程

很抱歉，没有找到与"${authorName}"完全匹配的作者教程。

您可以尝试以下热门作者：

- **阿真lrene** - AI绘画与视频创作领域知名自媒体作者
- **赛博小熊猫Loki** - 提示词达人，AI工具测评实践经验丰富
- **英语好课研磨** - AI辅助英语教学技巧分享
- **靠谱瓦叔AI趣探** - AI工具评测与使用技巧分享达人

或者输入具体的工具名称（如"即梦"、"DeepSeek"）获取工具详情。`;

        setMessages([
          ...newMessages,
          { role: 'assistant', content: reply }
        ]);
        setLoading(false);
        incChatCount();
        setChatCount(getChatCount());
        scrollToBottom();
        return;
      }
    }

    // 尝试查找本地工具
    const localTool = searchLocalTools(input);
    if (localTool) {
      // 找到工具，构建回复 - 优化布局
      let reply = `### ${localTool.name}\n\n`;
      reply += `${localTool.description}\n\n`;
      reply += `**[🔗 官网链接](${localTool.url})**\n\n`;

      // 添加相关文章
      if (localTool.relatedArticles && localTool.relatedArticles.length > 0) {
        reply += '#### 相关文章\n\n';
        localTool.relatedArticles.forEach((art: RelatedArticle, idx: number) => {
          reply += `${idx + 1}. [${art.title}](${art.url})\n`;
        });
        reply += '\n';
      }

      // 添加群友点评
      if (localTool.groupComments && localTool.groupComments.length > 0) {
        reply += '#### 群友点评\n\n';
        localTool.groupComments.forEach((cmt: GroupComment) => {
          reply += `- ${cmt.content}\n`;
        });
        reply += '\n';
      }

      // 查找相关教程
      const relatedTutorials = findRelatedTutorials(localTool.id, localTool.name);
      if (relatedTutorials.length > 0) {
        reply += '#### 相关教程\n\n';
        relatedTutorials.forEach((tutorial, idx) => {
          reply += `**${idx + 1}. [${tutorial.title}](${tutorial.url})**\n\n`;
          reply += `\`分类: ${tutorial.category}\`  \n`;
          reply += `\`难度: ${tutorial.difficultyLevel}\`\n\n`;
        });
      }

      // 发送回复
      setMessages([
        ...newMessages,
        { role: 'assistant', content: reply }
      ]);
      setLoading(false);
      incChatCount();
      setChatCount(getChatCount());
      scrollToBottom();
      return;
    }

    // 没有找到工具，使用AI回答
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await res.json() as ChatResponse;

      if (data.choices && data.choices[0]?.message?.content) {
        setMessages([...newMessages, { role: 'assistant', content: data.choices[0].message.content }]);
      } else {
        setError('AI助手未能返回有效回复。');
      }
    } catch {
      setError('请求失败，请检查网络或稍后再试。');
    }

    setLoading(false);
    incChatCount();
    setChatCount(getChatCount());
    scrollToBottom();
  };

  // 回车发送
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) {
      sendMessage();
    }
  };

  // 新话题按钮处理函数
  const handleNewTopic = () => {
    setMessages([
      { role: 'system', content: '你是一个乐于助人的AI助手。' },
      { role: 'assistant', content: WELCOME_MESSAGE }
    ]);
    setInput('');
    setError('');
  };

  // 修改渲染函数，移除未使用的参数
  const renderMarkdown = (content: string) => {
    return (
      <Suspense fallback={<div className="text-gray-500">加载中...</div>}>
        <ReactMarkdown
        components={{
          a: (props) => (
            <a
              {...props}
              style={{ color: '#2563eb', textDecoration: 'underline' }}
              target="_blank"
              rel="noopener noreferrer"
              onMouseOver={e => (e.currentTarget.style.color = '#1d4ed8')}
              onMouseOut={e => (e.currentTarget.style.color = '#2563eb')}
            >
              {props.children}
            </a>
          ),
          h3: (props) => (
            <h3
              {...props}
              style={{
                fontSize: isMobile ? '16px' : '18px',
                fontWeight: 'bold',
                margin: '10px 0 8px 0',
                color: '#1e40af'
              }}
            >
              {props.children}
            </h3>
          ),
          h4: (props) => (
            <h4
              {...props}
              style={{
                fontSize: isMobile ? '14px' : '16px',
                fontWeight: 'bold',
                margin: '12px 0 6px 0',
                color: '#3b82f6'
              }}
            >
              {props.children}
            </h4>
          ),
          hr: (props) => (
            <hr
              {...props}
              style={{
                border: 'none',
                borderTop: '1px solid #e5e7eb',
                margin: '8px 0'
              }}
            />
          ),
          code: ({ inline, ...props }: { inline?: boolean } & HTMLAttributes<HTMLElement>) => (
            inline ?
            <code
              {...props}
              style={{
                backgroundColor: '#f3f4f6',
                padding: '2px 4px',
                borderRadius: '4px',
                fontSize: isMobile ? '12px' : '13px',
                color: '#4b5563'
              }}
            >
              {props.children}
            </code> :
            <code {...props} />
          ),
          li: (props: HTMLAttributes<HTMLLIElement>) => (
            <li
              {...props}
              style={{
                marginBottom: '4px',
                paddingLeft: '4px'
              }}
            >
              {props.children}
            </li>
          ),
          h1: ({ children }) => (
            <h1 className="text-xl font-bold my-3">{children}</h1>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-6 my-2 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 my-2 space-y-1">{children}</ol>
          )
        }}
      >
        {content}
      </ReactMarkdown>
      </Suspense>
    );
  };

  // ========== 渲染组件 ==========

  // 如果AI助手功能被禁用，不渲染任何内容
  if (!AI_ASSISTANT_ENABLED) {
    return null; // 不渲染AI助手组件
  }

  return (
    <div style={{
      position: 'fixed',
      right: isMobile ? '5vw' : 40,
      bottom: isMobile ? 20 : 80,
      zIndex: 9999
    }}>
      {open ? (
        <div style={{
          width: chatWidth,
          height: chatHeight,
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          maxWidth: '95vw',
          maxHeight: '80vh'
        }}>
          <div style={{
            background: 'linear-gradient(90deg,#2563eb,#60a5fa)',
            color: '#fff',
            padding: isMobile ? '10px 12px' : '12px 16px',
            fontWeight: 'bold',
            fontSize: isMobile ? 16 : 18,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div className="flex items-center">
            KA21助手
              <span className="ml-2 text-xs bg-white/20 py-0.5 px-1.5 rounded-full">
                剩余 {10 - chatCount} 次
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button
                onClick={handleNewTopic}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '15px',
                  padding: '4px 10px',
                  marginRight: '10px',
                  fontSize: '12px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                开启新对话
              </button>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
          </div>
          <div style={{
            flex: 1,
            padding: isMobile ? 12 : 16,
            overflowY: 'auto',
            background: '#f4f6fa'
          }}>
            {messages.slice(1).map((msg, i) => (
              <div key={i} style={{
                marginBottom: 12,
                textAlign: msg.role === 'user' ? 'right' : 'left'
              }}>
                <div style={{
                  display: 'inline-block',
                  background: msg.role === 'user' ? 'linear-gradient(90deg,#2563eb,#60a5fa)' : '#f1f5f9',
                  color: msg.role === 'user' ? '#fff' : '#333',
                  borderRadius: 8,
                  padding: isMobile ? '6px 10px' : '8px 12px',
                  maxWidth: messageBubbleWidth,
                  wordBreak: 'break-all',
                  fontSize: isMobile ? 14 : 15
                }}>
                  {msg.role === 'assistant' ? (
                    renderMarkdown(msg.content)
                  ) : (
                    msg.content.split(/\r?\n/).map((line, idx) => (
                      <span key={idx}>
                        {line}
                        <br />
                      </span>
                    ))
                  )}
                </div>
              </div>
            ))}
            {loading && <div style={{ color: '#2563eb', fontSize: isMobile ? 13 : 14 }}>AI助手正在思考...</div>}
            {error && <div style={{ color: 'red', fontSize: isMobile ? 13 : 14 }}>{error}</div>}
            {chatCount >= 10 && <div style={{ color: '#f43f5e', fontSize: isMobile ? 14 : 15, marginTop: 8 }}>今日提问次数已用完，请明天再试！</div>}
            <div ref={messagesEndRef} />
          </div>
          <div style={{
            padding: isMobile ? '10px 8px' : 12,
            borderTop: '1px solid #eee',
            background: '#fff',
            paddingBottom: isMobile ? 15 : 20
          }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="请输入你的问题..."
              style={{
                width: inputWidth,
                padding: isMobile ? 6 : 8,
                borderRadius: 6,
                border: '1px solid #ddd',
                outline: 'none',
                marginRight: 8,
                fontSize: isMobile ? 14 : 15
              }}
              disabled={loading || chatCount >= 10}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim() || chatCount >= 10}
              style={{
                background: 'linear-gradient(90deg,#2563eb,#60a5fa)',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: isMobile ? '6px 12px' : '8px 16px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: isMobile ? 10 : 11
              }}
            >发送</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          style={{
            width: isMobile ? 48 : 56,
            height: isMobile ? 48 : 56,
            borderRadius: '50%',
            background: 'linear-gradient(90deg,#2563eb,#60a5fa)',
            color: '#fff',
            border: 'none',
            fontSize: isMobile ? 24 : 28,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            cursor: 'pointer'
          }}
          title="AI助手"
        >
          💬
        </button>
      )}
    </div>
  );
}
