FROM node:20-alpine

WORKDIR /app

# 优先复制 package 文件以利用缓存
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制剩余的应用代码
COPY . .

# 暴露开发端口
EXPOSE 5173

# 启动应用
CMD ["npm", "run", "dev", "--", "--host"]
