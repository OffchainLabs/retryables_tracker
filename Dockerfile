FROM node:latest

WORKDIR /app

COPY . .

RUN yarn install && yarn build

ENTRYPOINT ["yarn node dist/scr/main.js"]