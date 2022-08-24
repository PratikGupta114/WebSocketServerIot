FROM node:16.6.0

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . /app

EXPOSE 3001

CMD ["npm", "run", "start"]