FROM node:24-alpine

WORKDIR /app
COPY . .

EXPOSE 8032

CMD ["node", "server.mjs"]
