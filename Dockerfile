FROM node:16
MAINTAINER tolyan <pyshnenko94@yandex.ru>
WORKDIR /home/spamigor/node/wishBot
COPY package*.json ./
RUN npm install
COPY . .
CMD [ "node", "mongoTest.js" ]

