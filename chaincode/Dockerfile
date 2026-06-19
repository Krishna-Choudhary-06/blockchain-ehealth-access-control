FROM node:18-alpine
WORKDIR /usr/local/src
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 9999
CMD ["npm", "start"]
