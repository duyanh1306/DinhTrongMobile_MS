FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:18-alpine

WORKDIR /app

RUN npm install serve

COPY --from=build /app/build ./build

EXPOSE 3000

CMD ["npx", "serve", "-s", "build", "-l", "3000"]