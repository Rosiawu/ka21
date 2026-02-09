/**
 * 系统配置文件
 * 集中管理系统配置参数，便于统一调整和管理
 */

/**
 * 教程数据源控制
 * 
 * 设置为true: 使用独立的tutorials.json作为数据源
 * 设置为false: 使用tools.json中嵌套的relatedArticles字段(旧版模式)
 * 
 * 注意: 
 * 1. 切换为true后，需要确保tutorials.json文件存在且包含有效数据
 * 2. 可使用scripts/migrations/extract-tutorials.js脚本从tools.json生成tutorials.json
 * 3. 若需快速切换，可使用scripts/migrations/test-tutorials-switch.js脚本
 * 
 * TODO: [后期优化] 当教程数据完全迁移并稳定后，移除此配置项，并删除所有相关兼容代码
 * 参考项目根目录下的TODO.md文件中的"移除兼容层"任务
 */
export const USE_NEW_TUTORIALS_SOURCE = true;

// 其他配置项可以在这里添加
// 例如: 
// export const API_BASE_URL = process.env.NODE_ENV === 'production' ? '/api/v1' : 'http://localhost:3000/api/v1';
// export const MAX_SEARCH_RESULTS = 50; 