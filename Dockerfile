FROM node:16
WORKDIR /home/spamigor/node/wishBot
COPY package*.json ./
RUN npm install
COPY . .
CMD [ "node", "mongoTest.js" ]

