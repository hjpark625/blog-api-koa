FROM node:16-alpine

WORKDIR /usr/app

COPY package.json .
COPY yarn.lock .
COPY tsconfig.json .

ENV PORT=4000

RUN node --version
RUN yarn --version

RUN yarn install

COPY . .

RUN yarn build

EXPOSE 4000
ENTRYPOINT ["yarn", "start"]