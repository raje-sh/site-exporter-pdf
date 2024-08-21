FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

RUN apt update
RUN apt upgrade -y
RUN apt install -y fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 libgtk2.0-0 libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libgbm1 libasound2
RUN apt install -y chromium
RUN npm i -g npm@latest