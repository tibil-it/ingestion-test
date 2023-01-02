FROM node:lts-alpine 
WORKDIR /app
COPY package.json .
RUN npm install && npm i aws-sdk
COPY . .
 
CMD ["node","index"]

