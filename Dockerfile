FROM ghcr.io/puppeteer/puppeteer:22.15.0@sha256:62af46dd09ea2dc6a79ec22e697a504dbf13ca8605006e7f7ca1cbd0cdea6a2f
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

USER root
RUN npm install -g npm
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

RUN chown -Rh pptruser:pptruser /app
RUN chmod -R 777 /app
USER pptruser
CMD ["npm", "run", "start"]
