FROM node:20-alpine@sha256:eb8101caae9ac02229bd64c024919fe3d4504ff7f329da79ca60a04db08cef52
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["node", "your-script.js"]
