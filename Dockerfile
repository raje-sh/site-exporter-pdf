FROM ghcr.io/puppeteer/puppeteer:23.0.2
RUN npx puppeteer browsers install chrome
USER root
WORKDIR /app
RUN chown -Rh pptruser:pptruser /app

COPY package*.json ./
USER root
RUN npm install
COPY . .
# USER pptruser
CMD ["npm", "run", "start"]
