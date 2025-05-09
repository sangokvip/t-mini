#!/bin/bash

# 设置环境变量
export NODE_ENV=production

# 安装依赖
npm install --legacy-peer-deps

# 运行构建
./node_modules/.bin/vite build 