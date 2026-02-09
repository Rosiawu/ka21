#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 图片优化配置
const config = {
  // 需要优化的图片目录
  directories: [
    'public/images/team',
    'public/images/tutorials',
    'public/images/social'
  ],
  // 图片质量设置
  quality: {
    jpeg: 80,
    png: 90,
    webp: 85
  },
  // 最大宽度（像素）
  maxWidth: 1200,
  // 是否转换为 WebP
  convertToWebp: true
};

// 检查是否安装了 sharp
function checkDependencies() {
  try {
    require('sharp');
    return true;
  } catch (e) {
    console.log('❌ Sharp 未安装，请先安装：npm install sharp');
    return false;
  }
}

// 获取图片信息
function getImageInfo(filePath) {
  const stats = fs.statSync(filePath);
  return {
    size: stats.size,
    sizeKB: (stats.size / 1024).toFixed(2),
    path: filePath
  };
}

// 优化单个图片
async function optimizeImage(inputPath, outputPath, format = null) {
  const sharp = require('sharp');

  try {
    let pipeline = sharp(inputPath);

    // 调整大小
    pipeline = pipeline.resize(config.maxWidth, null, {
      withoutEnlargement: true
    });

    // 根据格式优化
    if (format === 'webp' || (config.convertToWebp && !format)) {
      pipeline = pipeline.webp({ quality: config.quality.webp });
      outputPath = outputPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    } else if (inputPath.match(/\.(jpg|jpeg)$/i)) {
      pipeline = pipeline.jpeg({ quality: config.quality.jpeg });
    } else if (inputPath.match(/\.png$/i)) {
      pipeline = pipeline.png({ quality: config.quality.png });
    }

    await pipeline.toFile(outputPath);

    const originalSize = getImageInfo(inputPath);
    const optimizedSize = getImageInfo(outputPath);
    const savings = ((originalSize.size - optimizedSize.size) / originalSize.size * 100).toFixed(1);

    console.log(`✅ ${path.basename(inputPath)} → ${path.basename(outputPath)}`);
    console.log(`   原始: ${originalSize.sizeKB} KB → 优化: ${optimizedSize.sizeKB} KB (节省 ${savings}%)`);

    return { originalSize, optimizedSize, savings };
  } catch (error) {
    console.error(`❌ 优化失败: ${inputPath}`, error.message);
    return null;
  }
}

// 主函数
async function main() {
  console.log('🖼️  开始优化图片...\n');

  if (!checkDependencies()) {
    process.exit(1);
  }

  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  let processedFiles = 0;

  for (const dir of config.directories) {
    if (!fs.existsSync(dir)) {
      console.log(`⚠️  目录不存在: ${dir}`);
      continue;
    }

    console.log(`📁 处理目录: ${dir}`);

    const files = fs.readdirSync(dir).filter(file =>
      file.match(/\.(jpg|jpeg|png)$/i)
    );

    for (const file of files) {
      const inputPath = path.join(dir, file);
      const outputPath = path.join(dir, `optimized-${file}`);

      const result = await optimizeImage(inputPath, outputPath);

      if (result) {
        totalOriginalSize += result.originalSize.size;
        totalOptimizedSize += result.optimizedSize.size;
        processedFiles++;
      }
    }
  }

  if (processedFiles > 0) {
    const totalSavings = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(1);
    console.log('\n📊 优化总结:');
    console.log(`   处理文件: ${processedFiles}`);
    console.log(`   原始大小: ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   优化大小: ${(totalOptimizedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   节省空间: ${totalSavings}%`);
  } else {
    console.log('\n⚠️  没有找到需要优化的图片');
  }
}

// 运行
main().catch(console.error);