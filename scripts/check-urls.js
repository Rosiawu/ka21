const fs = require('fs');
const path = require('path');
const axios = require('axios');

// 控制台颜色
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// 设置超时时间（毫秒）
let TIMEOUT = 10000;

// 解析命令行参数
const args = process.argv.slice(2);
const showHelp = args.includes('--help') || args.includes('-h');
const showCheckOnly = args.includes('--check-only');

// 解析超时参数
const timeoutArg = args.find(arg => arg.startsWith('--timeout='));
if (timeoutArg) {
  const timeoutValue = parseInt(timeoutArg.split('=')[1], 10);
  if (!isNaN(timeoutValue) && timeoutValue > 0) {
    TIMEOUT = timeoutValue;
  } else {
    console.warn(`${colors.yellow}警告: 无效的超时值，将使用默认值(${TIMEOUT}ms)${colors.reset}`);
  }
}

/**
 * 显示帮助信息
 */
function showHelpInfo() {
  console.log(`
${colors.cyan}链接有效性检查工具${colors.reset}
  
${colors.yellow}用法:${colors.reset}
  node scripts/check-urls.js [选项]
  
${colors.yellow}选项:${colors.reset}
  --help, -h        显示帮助信息
  --check-only      只显示最终摘要，不显示检查过程
  --timeout=<毫秒>   设置请求超时时间，默认为10000毫秒
  
${colors.yellow}示例:${colors.reset}
  node scripts/check-urls.js                 # 完整运行，显示详细过程
  node scripts/check-urls.js --check-only    # 只显示摘要结果
  node scripts/check-urls.js --timeout=5000  # 设置超时时间为5秒
  `);
}

// 处理帮助请求
if (showHelp) {
  showHelpInfo();
  process.exit(0);
}

/**
 * 检查URL是否可访问
 * @param {string} url 要检查的URL
 * @returns {Promise<{success: boolean, status?: number, error?: string}>}
 */
async function checkUrl(url) {
  try {
    // 使用axios检查URL
    const response = await axios.head(url, {
      timeout: TIMEOUT,
      validateStatus: null, // 不抛出HTTP错误
      maxRedirects: 5
    });
    
    return {
      success: response.status >= 200 && response.status < 400,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 格式化时间（秒）为可读字符串
 * @param {number} seconds 秒数
 * @returns {string} 格式化后的时间字符串
 */
function formatTime(seconds) {
  if (seconds < 60) {
    return `${Math.round(seconds)}秒`;
  } else if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}分${Math.round(seconds % 60)}秒`;
  } else {
    return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分`;
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    // 读取tools.json文件
    const toolsPath = path.join(__dirname, '../src/data/tools.json');
    
    if (!showCheckOnly) {
      console.log(`${colors.cyan}尝试读取文件: ${toolsPath}${colors.reset}`);
    }
    
    let toolsData;
    try {
      const fileContent = fs.readFileSync(toolsPath, 'utf8');
      
      if (!showCheckOnly) {
        console.log(`${colors.cyan}文件读取成功，文件大小: ${fileContent.length} 字节${colors.reset}`);
      }
      
      const jsonData = JSON.parse(fileContent);
      if (!jsonData.tools || !Array.isArray(jsonData.tools)) {
        console.error(`${colors.red}JSON格式不正确，找不到tools数组${colors.reset}`);
        return;
      }
      
      toolsData = jsonData.tools;
      
      if (!showCheckOnly) {
        console.log(`${colors.cyan}JSON解析成功，工具数量: ${toolsData.length}${colors.reset}`);
      }
    } catch (fileError) {
      console.error(`${colors.red}文件读取或解析失败:${colors.reset}`, fileError);
      return;
    }
    
    console.log(`${colors.cyan}开始检查 ${toolsData.length} 个工具的URL...${colors.reset}${showCheckOnly ? '' : '\n'}`);
    
    let validCount = 0;
    let invalidCount = 0;
    let invalidTools = [];
    
    // 检查每个工具的URL
    let startTime = Date.now();
    let lastProgressUpdate = 0;
    
    for (let i = 0; i < toolsData.length; i++) {
      const tool = toolsData[i];
      const { id, name, url } = tool;
      
      // 更新进度指示器
      const currentTime = Date.now();
      if (!showCheckOnly && (i === 0 || i === toolsData.length - 1 || currentTime - lastProgressUpdate > 2000)) {
        const progress = ((i + 1) / toolsData.length * 100).toFixed(1);
        const elapsedTime = (currentTime - startTime) / 1000;
        const itemsPerSecond = (i + 1) / elapsedTime;
        const remainingItems = toolsData.length - (i + 1);
        const remainingTimeEstimate = remainingItems / itemsPerSecond;
        
        process.stdout.write(`\r${colors.cyan}[进度: ${progress}%] 已检查 ${i+1}/${toolsData.length} 个工具 - 预计剩余: ${formatTime(remainingTimeEstimate)}${colors.reset}          \n`);
        lastProgressUpdate = currentTime;
      }
      
      if (!showCheckOnly) {
        process.stdout.write(`[${i+1}/${toolsData.length}] 检查: ${name} (${url})... `);
      }
      
      const result = await checkUrl(url);
      
      if (result.success) {
        if (!showCheckOnly) {
          process.stdout.write(`${colors.green}正常访问 ✓${colors.reset}\n`);
        }
        validCount++;
      } else {
        let errorMsg = result.status ? `HTTP状态: ${result.status}` : result.error;
        
        if (!showCheckOnly) {
          process.stdout.write(`${colors.red}无法访问 ✗ (${errorMsg})${colors.reset}\n`);
        }
        
        invalidCount++;
        invalidTools.push({
          id,
          name,
          url,
          error: errorMsg
        });
      }
    }
    
    // 输出结果摘要
    console.log(`\n${colors.cyan}检查完成!${colors.reset}`);
    console.log(`${colors.green}正常工具: ${validCount}${colors.reset}`);
    console.log(`${colors.red}失效工具: ${invalidCount}${colors.reset}`);
    
    if (invalidCount > 0) {
      console.log(`\n${colors.yellow}失效工具列表:${colors.reset}`);
      invalidTools.forEach((tool, index) => {
        console.log(`${colors.yellow}${index+1}. ${tool.name} (ID: ${tool.id})${colors.reset}`);
        console.log(`   URL: ${tool.url}`);
        console.log(`   错误: ${tool.error}`);
      });
      
      // 将失效工具列表保存到文件
      const invalidToolsJson = JSON.stringify(invalidTools, null, 2);
      const outputPath = path.join(__dirname, 'invalid-tools.json');
      fs.writeFileSync(outputPath, invalidToolsJson);
      console.log(`\n${colors.magenta}失效工具列表已保存到: ${outputPath}${colors.reset}`);
    }
    
  } catch (error) {
    console.error(`${colors.red}发生错误:${colors.reset}`, error);
  }
}

// 运行主函数
main().catch(console.error); 