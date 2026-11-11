'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');

const HOST = 'localhost';
const PORT = Number(process.env.QIUZHAO_PORT || 8000);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new RangeError('QIUZHAO_PORT 必须是 1 到 65535 之间的整数');
}
const APP_URL = `http://${HOST}:${PORT}/`;
const PROJECT_DIR = path.resolve(__dirname, '..');
const BACKUP_DIR = path.join(
  process.pkg ? path.dirname(process.execPath) : PROJECT_DIR,
  'backups',
);
const MAX_BACKUP_SIZE = 10 * 1024 * 1024;
const CONTENT_TYPES = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/script.js': ['script.js', 'text/javascript; charset=utf-8'],
  '/style.css': ['style.css', 'text/css; charset=utf-8'],
};

function saveBackup(request, response) {
  if (!request.headers['content-type']?.startsWith('application/json')) {
    response.writeHead(415, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ error: '只接受 JSON 格式的备份数据' }));
    request.resume();
    return;
  }

  const chunks = [];
  let size = 0;
  let tooLarge = false;

  request.on('data', (chunk) => {
    size += chunk.length;
    if (size > MAX_BACKUP_SIZE) {
      tooLarge = true;
      chunks.length = 0;
      return;
    }
    if (!tooLarge) chunks.push(chunk);
  });

  request.on('end', async () => {
    if (tooLarge) {
      response.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ error: '备份文件不能超过 10 MB' }));
      return;
    }

    let data;
    try {
      data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (!Array.isArray(data)) throw new Error('数据不是数组');
    } catch (error) {
      response.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ error: `备份数据格式无效：${error.message}` }));
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `qiuzhao-backup-${timestamp}.json`;
    try {
      await fs.promises.mkdir(BACKUP_DIR, { recursive: true });
      await fs.promises.writeFile(
        path.join(BACKUP_DIR, filename),
        JSON.stringify(data),
        { flag: 'wx' },
      );
      response.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ filename }));
    } catch (error) {
      console.error(`保存备份失败：${error.message}`);
      response.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ error: '无法写入备份文件夹，请检查文件夹权限' }));
    }
  });
}

function openBrowser() {
  execFile('rundll32.exe', ['url.dll,FileProtocolHandler', APP_URL], (error) => {
    if (error) {
      console.error(`无法自动打开浏览器，请手动访问 ${APP_URL}`);
    }
  });
}

const server = http.createServer((request, response) => {
  let pathname;
  try {
    pathname = new URL(request.url || '/', APP_URL).pathname;
  } catch {
    response.writeHead(400);
    response.end();
    return;
  }

  if (request.method === 'POST' && pathname === '/api/backup') {
    saveBackup(request, response);
    return;
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD, POST' });
    response.end();
    return;
  }

  const asset = CONTENT_TYPES[pathname];
  if (!asset) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }

  try {
    const body = fs.readFileSync(path.join(PROJECT_DIR, asset[0]));
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Length': body.length,
      'Content-Type': asset[1],
    });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch (error) {
    console.error(`读取网页文件失败：${error.message}`);
    response.writeHead(500);
    response.end('Unable to load the application');
  }
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`本地端口 ${PORT} 已被占用。请先关闭已有的应用窗口，再重试。`);
  } else {
    console.error(`启动本地服务失败：${error.message}`);
  }
  console.error('按 Enter 键退出。');
  process.stdin.resume();
  process.stdin.once('data', () => process.exit(1));
});

server.listen(PORT, HOST, () => {
  console.log(`秋招投递管理已启动：${APP_URL}`);
  console.log('关闭此窗口或按 Ctrl+C 可停止应用。');
  if (process.env.QIUZHAO_NO_BROWSER !== '1') openBrowser();
});
