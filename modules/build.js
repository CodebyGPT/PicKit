#!/usr/bin/env node
// =========================================================================
// Text Selection Toolbar 构建脚本
// 用法:
//   node modules/build.js              → ESLint检查 + 构建 main.user.js
//   node modules/build.js --watch      → 监听文件变化自动构建
//   node modules/build.js --minify     → 构建并压缩
//   node modules/build.js --all        → 同时生成 main.user.js 和 main.min.user.js
//   node modules/build.js --no-lint    → 跳过 ESLint 检查直接构建
//   node modules/build.js --lint-only  → 仅运行 ESLint 检查
// =========================================================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── 模块文件列表 (按依赖顺序排列) ────────────────────────────────────
const modules = [
    '00-header.js',        // UserScript 元数据 + 许可声明
    '01-compat.js',        // GM API 异步兼容层
    '02-config.js',        // 配置常量 + 状态管理
    '03-i18n.js',          // 多语言系统
    '04-compliance.js',    // 编辑模式 + 合规声明
    '05-menu.js',          // GM 菜单系统
    '06-extractors.js',    // 链接与密码提取器
    '07-selection.js',     // 选区定位计算器
    '08-shadow-dom.js',    // Shadow DOM 容器 + 样式
    '09-drag-preview.js',  // 拖拽链接预览
    '10-unlock-mode.js',   // 超级取词模式
    '11-clipboard.js',     // 剪贴板操作 + Toast
    '12-theme.js',         // 背景亮度检测
    '13-renderer.js',      // 按钮渲染引擎
    '14-events.js',        // 事件处理系统
    '15-text-correct.js',  // 智能文本校正
    '16-blocker.js',       // 元素屏蔽器
    '17-festival.js',      // 烟花粒子特效
    '18-input-recovery.js',// 码字防丢子系统
    '19-bootstrap.js',     // 启动引导 (IIFE 入口)
];

// ── 配置 ─────────────────────────────────────────────────────────
const modulesDir = __dirname;
const outputDir = path.join(__dirname, '..');
const USERSCRIPT_NAME = 'main.user.js';
const MINIFIED_NAME = 'main.min.user.js';
const METAJS_NAME = 'main.meta.js';

// ── 解析命令行参数 ────────────────────────────────────────────────
const args = process.argv.slice(2);
const doWatch = args.includes('--watch');
const doMinify = args.includes('--minify');
const doAll = args.includes('--all');
const noLint = args.includes('--no-lint');
const lintOnly = args.includes('--lint-only');

// ── ESLint 检查 ──────────────────────────────────────────────────
function runLint() {
    const rootDir = path.join(__dirname, '..');
    const eslintBin = path.join(rootDir, 'node_modules', '.bin', 'eslint');

    console.log(`\n[${new Date().toLocaleTimeString()}] Running ESLint...`);

    try {
        const result = execSync(
            `"${eslintBin}" "modules/*.js" --max-warnings 999`,
            { cwd: rootDir, stdio: 'pipe' }
        );
        const output = result.toString().trim();
        if (output) {
            console.log(output);
        }
        console.log('  ✓  ESLint passed, no errors.\n');
        return true;
    } catch (err) {
        const stdout = err.stdout ? err.stdout.toString().trim() : '';
        const stderr = err.stderr ? err.stderr.toString().trim() : '';
        const output = stdout || stderr;

        let errorCount = 0;
        let warningCount = 0;

        if (output) {
            // 提取错误和警告计数
            const errorMatch = output.match(/(\d+)\s+error/);
            const warningMatch = output.match(/(\d+)\s+warning/);
            errorCount = errorMatch ? parseInt(errorMatch[1]) : 0;
            warningCount = warningMatch ? parseInt(warningMatch[1]) : 0;

            // 打印所有 error 行
            const lines = output.split('\n');
            let shownErrors = false;
            for (const line of lines) {
                if (/\d+:\d+\s+error\b/.test(line)) {
                    if (!shownErrors) {
                        console.error(`\n  ESLint errors (must be fixed before build):\n`);
                        shownErrors = true;
                    }
                    console.error(`  ${line}`);
                }
            }

            if (shownErrors) {
                console.error(`\n  ${errorCount} error(s) must be fixed before build.`);
            }
            if (warningCount > 0) {
                console.log(`  ${warningCount} warning(s) — review recommended but not blocking.\n`);
            }
        } else {
            console.error(`\n  ESLint check failed with exit code ${err.status}\n`);
        }

        if (errorCount > 0) {
            console.error('  Build ABORTED due to ESLint errors. Fix and try again.\n');
            return false;
        }
        return true;
    }
}

// ── 核心: 合并模块 ───────────────────────────────────────────────
function readModule(filename) {
    const filePath = path.join(modulesDir, filename);
    if (!fs.existsSync(filePath)) {
        throw new Error(`Module not found: ${filename}`);
    }
    return fs.readFileSync(filePath, 'utf-8');
}

function concatModules() {
    let output = '';
    for (const filename of modules) {
        const content = readModule(filename);
        output += content + '\n';
    }
    return output.trim() + '\n';
}

// ── 压缩: 轻量级 JS 压缩 (仅去除注释和多余空白, 不改变语义) ──────
function minify(code) {
    // 1. 提取 UserScript 头部 (==UserScript== ... ==/UserScript==)
    const headerMatch = code.match(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/);
    const header = headerMatch ? headerMatch[0] : '';

    // 2. 提取多行注释块 (/* ... */)，排除头部
    let body = headerMatch ? code.slice(headerMatch.index + headerMatch[0].length) : code;

    // 注: 这里不做激进压缩（如变量缩短），只移除:
    //   - 单行注释 (// ...) 但保留 // ==UserScript== 和 // @grant 等
    //   - 多余的连续空行
    //   - 行首行尾空白

    const lines = body.split('\n');
    const result = [];

    let prevEmpty = false;
    for (let line of lines) {
        // 跳过纯注释行 (但保留看起来像伪指令的行)
        const trimmed = line.trim();
        if (trimmed.startsWith('//') && !trimmed.startsWith('// @') && !trimmed.startsWith('// ==')) {
            continue;
        }
        // 去除行内注释 (简单处理: 非字符串内的 //)
        // 跳过此步骤以保安全 — 不处理行内注释

        if (trimmed === '') {
            if (!prevEmpty) {
                result.push('');
                prevEmpty = true;
            }
        } else {
            result.push(line); // 保留原始缩进
            prevEmpty = false;
        }
    }

    body = result.join('\n').trim();
    return header + '\n' + body + '\n';
}

// ── 写入文件 ─────────────────────────────────────────────────────
function writeOutput(filename, content) {
    const filePath = path.join(outputDir, filename);
    const oldContent = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
    if (content === oldContent) {
        return false; // 无变化
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
}

// ── 打印构建报告 ─────────────────────────────────────────────────
function report(name, filePath, sizeBytes, changed) {
    const marker = changed ? '✓' : '○';
    console.log(`  ${marker} ${name}  →  ${path.relative(outputDir, filePath)}  (${(sizeBytes / 1024).toFixed(1)} KB)`);
}

// ── 执行构建 ─────────────────────────────────────────────────────
function build(skipLint = false) {
    const startTime = Date.now();

    // ESLint 检查 (除非显式跳过)
    if (!skipLint && !noLint) {
        if (!runLint()) {
            return; // 检查未通过，中止构建
        }
    }

    console.log(`[${new Date().toLocaleTimeString()}] Building...`);

    try {
        const raw = concatModules();

        if (doMinify || doAll) {
            // 生成压缩版
            const minified = minify(raw);
            const changed = writeOutput(MINIFIED_NAME, minified);
            report('minified', path.join(outputDir, MINIFIED_NAME), minified.length, changed);

            // 生成 .meta.js (仅元数据，用于 require)
            const metaMatch = raw.match(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/);
            if (metaMatch) {
                writeOutput(METAJS_NAME, metaMatch[0] + '\n');
                report('meta', path.join(outputDir, METAJS_NAME), metaMatch[0].length, false);
            }
        }

        if (!doMinify || doAll) {
            // 生成完整版
            const changed = writeOutput(USERSCRIPT_NAME, raw);
            report('full', path.join(outputDir, USERSCRIPT_NAME), raw.length, changed);
        }

        const elapsed = Date.now() - startTime;
        console.log(`  Done in ${elapsed}ms (${modules.length} modules)\n`);

    } catch (err) {
        console.error(`\n  ✗ Build failed: ${err.message}\n`);
    }
}

// ── Watch 模式 ─────────────────────────────────────────────────────
function watch() {
    // Watch 模式下也先做一次 lint 检查
    if (!noLint) {
        if (!runLint()) {
            console.error('Watch mode requires ESLint to pass first.\n');
            return;
        }
    }
    console.log('Watching for changes... (Ctrl+C to stop)\n');

    // 监听 modules 目录
    const watchDir = modulesDir;

    // 使用简单的轮询方式 (跨平台兼容，不依赖 fs.watch 的可靠性)
    let lastMtimes = {};
    const initMtimes = () => {
        modules.forEach(f => {
            const fp = path.join(modulesDir, f);
            try { lastMtimes[f] = fs.statSync(fp).mtimeMs; } catch (e) {}
        });
    };
    initMtimes();

    // 首次构建
    build();

    setInterval(() => {
        let changed = false;
        for (const f of modules) {
            const fp = path.join(modulesDir, f);
            try {
                const mtime = fs.statSync(fp).mtimeMs;
                if (lastMtimes[f] !== mtime) {
                    lastMtimes[f] = mtime;
                    changed = true;
                }
            } catch (e) {}
        }
        if (changed) {
            build();
        }
    }, 800);
}

// ── 入口 ───────────────────────────────────────────────────────────
if (lintOnly) {
    // 仅运行 ESLint 检查，不构建
    const passed = runLint();
    process.exit(passed ? 0 : 1);
} else if (doWatch) {
    watch();
} else {
    build();
}
