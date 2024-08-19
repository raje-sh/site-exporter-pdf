#!/bin/bash
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium # インストールしたChromiumのPathをPuppeteerに渡す
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true # Puppeteerが勝手にChromiumを入れるのを防ぐ

sudo echo 'export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium' >> ~/.bashrc
sudo echo 'export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true' >> ~/.bashrc