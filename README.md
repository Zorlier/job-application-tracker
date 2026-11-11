# 应届生秋招投递记录📝

这是一个用来记录和管理秋招投递进度的本地网页应用。


<img width="1080" height="903" alt="image" src="https://github.com/user-attachments/assets/d92cec36-af1c-4c82-a47c-6a2fa41ad8d5" />

## 运行方式

### 使用 Windows 可执行文件（推荐）

双击项目根目录的 `qiuzhao.exe`。程序会启动本地网页服务并打开默认浏览器，不需要安装 Python 或 Node.js。关闭程序的控制台窗口即可停止服务。此 exe 面向 Windows x64。

如果本机的 8000 端口已被占用，可在命令提示符中使用其他端口启动：`set QIUZHAO_PORT=8001`，再运行 `qiuzhao.exe`。

在 exe 中点击“导出”，备份会自动保存到 exe 同目录下的 `backups` 文件夹，每次导出都会生成带时间戳的新 JSON 文件。首次导出会自动创建文件夹。点击“导入”仍可选择已有的 JSON 备份文件。

如果要从源码生成 exe，需要安装 Node.js 22 或更高版本，然后在项目目录运行：

```powershell
npm install
npm run build:exe
```

生成的文件位于项目根目录的 `qiuzhao.exe`。可以把这个 exe 单独发给其他 Windows 用户使用。

### 从源码运行

以下方式需要安装 Python：

1. 双击 `scripts\run_app.bat`
2. 浏览器访问：
   - http://localhost:8000
3. 在页面中新增公司、岗位、城市和阶段即可

## 功能

- 记录投递公司和岗位
- 记录城市、方向、投递渠道
- 更新阶段：已投简历 / 简历挂 / 一面 / 一面挂 / 二面 / 二面挂 / offer / 拒绝
- 记录面试经验和备注
- 查看各城市的投递情况
- 统计总投递数、进行中、offer 等数据

## 数据保存

数据保存在浏览器本地 localStorage 中，刷新页面不丢失。
通过 GitHub Pages 或 Python 启动时，点击“导出”会由浏览器下载 JSON 备份文件。

## 说明

如果 `scripts\run_app.bat` 没有启动，请确认 Python 环境存在，或修改脚本中的 Python 路径。
