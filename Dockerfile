FROM node:10.16.3

RUN npm i -g npm@6.11.3

ENV BASE_URL ""

ADD src /app/src
ADD package.json package-lock.json tsconfig.json /app/

WORKDIR /app

RUN npm install
RUN ls -lah .
RUN npm run build

EXPOSE 3000

CMD [ "npm", "start" ]
