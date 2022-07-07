FROM node:16.15.1-alpine3.15

WORKDIR /app
COPY package*.json ./

RUN npm install --force
RUN mkdir -p node_modules/.cache && chmod -R 777 node_modules/.cache