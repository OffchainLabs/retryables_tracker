FROM node:latest

WORKDIR /app

COPY . .

RUN yarn install && yarn build

ENTRYPOINT ["yarn", "node", "dist/src/main.js"]