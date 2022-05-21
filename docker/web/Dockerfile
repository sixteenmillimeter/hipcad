FROM node:lts

WORKDIR /app

COPY ./dist ./dist
COPY ./package*.json ./

RUN npm ci --only=production

COPY ./table ./table
COPY ./views ./views
COPY ./static ./static
COPY ./.env ./

EXPOSE 3022

CMD [ "node", "." ]