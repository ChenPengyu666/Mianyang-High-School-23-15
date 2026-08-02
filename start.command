#!/bin/bash
# ============================================
# 15班班级蹭饭地图 - 启动脚本
# 双击运行：启动本地服务并自动打开浏览器
# ============================================
cd "$(dirname "$0")"

# 1. 依赖检查
command -v python3 >/dev/null 2>&1 || { echo "错误：未找到 python3，请先安装 Python3"; read -r; exit 1; }

PORT=8765

# 2. 端口残留清理
for pid in $(lsof -ti tcp:$PORT 2>/dev/null); do
  kill "$pid" 2>/dev/null
  echo "已清理端口 $PORT 残留进程 $pid"
done

# 3. 启动本地服务
python3 -m http.server "$PORT" >/dev/null 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null; echo ""; echo "服务已停止"' INT TERM EXIT

# 4. 端口就绪检测
echo "正在启动 15班班级蹭饭地图 ..."
for i in $(seq 1 30); do
  if curl -s -o /dev/null "http://localhost:$PORT/"; then
    break
  fi
  sleep 0.3
done

# 5. 自动打开浏览器
sleep 0.5
open "http://localhost:$PORT"

echo "服务运行中：http://localhost:$PORT （按 Ctrl+C 退出）"
wait $SRV
