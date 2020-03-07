FROM node:10.16.3

RUN npm i -g npm@6.11.3

WORKDIR /app

ENV BASE_URL ""
ENV PORT 3000

ADD package.json package-lock.json tsconfig.json /app/
RUN npm install

ADD src /app/src
RUN npm run build

CMD [ "npm", "start" ]
