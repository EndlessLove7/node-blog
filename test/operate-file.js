'use strict';

/**
 * 这个脚本用于处理指定目录中的 .txt 文件。
 *
 * 功能说明：
 * 1. 读取指定目录下所有 .txt 文件
 * 2. 批量给文件名加上前缀，如 backup_ 或自定义前缀
 * 3. 把所有文件内容合并到 all.txt
 * 4. 通过命令行参数传入目录路径和前缀
 * 5. 处理时输出进度，并对异常情况给出友好提示
 *
 * 使用方式：
 *   node operate-file.js <目录路径> [前缀]
 *
 * 例如：
 *   node operate-file.js ./docs
 *   node operate-file.js ./docs backup_
 *   node operate-file.js ./docs my_
 *
 * 关键代码说明：
 *   process.argv.slice(2)  -> 获取命令行参数
 *   args[0]               -> 目录路径
 *   args[1]               -> 自定义前缀
 *   如果没有传前缀，则使用默认值 'backup_'
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

function printUsage() {
  console.log('用法：node operate-file.js <目录路径> [前缀]');
  console.log('示例：node operate-file.js ./docs');
  console.log('示例：node operate-file.js ./docs backup_');
  console.log('示例：node operate-file.js ./docs my_');
}

function getTxtFiles(dirPath) {
  return fs.readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => fileName.toLowerCase().endsWith('.txt') && fileName !== 'all.txt');
}

function main() {
  console.log(os.platform(), process.platform, 'is diff?');
  const args = process.argv.slice(2);
  const targetDir = args[0];
  const prefix = args[1] || 'backup_';
  // process.argv 是 Node 里一个数组，里面保存了启动当前脚本时的参数信息。
  // 终端执行：node operate-file.js ./demo_txt my_
  // 那么 process.argv 大概是这样的：
  // [
  //   '/usr/local/bin/node',
  //   '/Users/zengqingxia/node/operate-file.js',
  //   './demo_txt',
  //   'my_'
  // ]
  // 因为前两个值分别是：
      // Node 可执行文件路径
      // 当前脚本路径
  // 真正用户传入的参数是从第 3 个开始，所以：process.argv.slice(2)，得到：['./demo_txt', 'my_']

  if (!targetDir) {
    printUsage();
    process.exit(1);
  }

  const dirPath = path.resolve(targetDir);

  if (!fs.existsSync(dirPath)) {
    console.error(`错误：目录不存在：${dirPath}`);
    process.exit(1);
  }

  const stats = fs.statSync(dirPath);
  // stats 拿到的“文件/目录状态对象”。
  // 它的作用是：判断某个路径到底是“文件”还是“目录”，并且还能拿到很多信息，比如：
  // 是否是目录 stats.isDirectory()
  // 是否是文件 stats.isFile()
  // 大小 stats.size
  // 修改时间 stats.mtime

  if (!stats.isDirectory()) {
    console.error(`错误：路径不是目录：${dirPath}`);
    process.exit(1);
  }

  console.log(`开始处理目录：${dirPath}`);
  console.log(`使用前缀：${prefix}`);

  try {
    const txtFiles = getTxtFiles(dirPath);

    if (txtFiles.length === 0) {
      console.warn('提示：目录中没有 .txt 文件可处理。');
      return;
    }

    console.log(`发现 ${txtFiles.length} 个 .txt 文件。`);

    txtFiles.forEach((fileName, index) => {

      // 文件重命名
      // const oldPath = path.join(dirPath, fileName);
      // const newFileName = `${prefix}${index + 1}.txt`;
      // const newPath = path.join(dirPath, newFileName);

      // try {
      //   if (fs.existsSync(newPath)) {
      //     console.warn(`目标文件已存在，将覆盖：${newFileName}`);
      //   }
      //   fs.renameSync(oldPath, newPath);
      //   console.log(`[${index + 1}/${txtFiles.length}] 重命名：${fileName} -> ${newFileName}`);
      // } catch (error) {
      //   console.error(`重命名失败：${fileName} -> ${newFileName}，原因：${error.message}`);
      // }

      const newFileName = fileName.startsWith(prefix) ? fileName : `${prefix}${fileName}`;
      const oldPath = path.join(dirPath, fileName);
      const newPath = path.join(dirPath, newFileName);

      if (fileName === newFileName) {
        console.log(`[${index + 1}/${txtFiles.length}] 跳过已带前缀文件：${fileName}`);
        return;
      }

      try {
        fs.renameSync(oldPath, newPath);
        console.log(`[${index + 1}/${txtFiles.length}] 重命名：${fileName} -> ${newFileName}`);
      } catch (error) {
        console.error(`重命名失败：${fileName} -> ${newFileName}，原因：${error.message}`);
      }
    });
    const renamedTxtFiles = getTxtFiles(dirPath);
    const mergedFilePath = path.join(dirPath, 'all.txt');
    let mergedContent = '';

    console.log('开始合并文件内容到 all.txt...');

    renamedTxtFiles.forEach((fileName, index) => {
      const filePath = path.join(dirPath, fileName);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        mergedContent += `\n--- ${fileName} ---\n${content}\n`;
        console.log(`[${index + 1}/${renamedTxtFiles.length}] 读取：${fileName}`);
      } catch (error) {
        console.error(`读取文件失败：${fileName}，原因：${error.message}`);
      }
    });

    fs.writeFileSync(mergedFilePath, mergedContent, 'utf8');
    console.log(`合并完成，结果已写入：${mergedFilePath}`);
    console.log('处理完成。');
  } catch (error) {
    console.error(`处理失败：${error.message}`);
    process.exit(1);
  }
}

main();