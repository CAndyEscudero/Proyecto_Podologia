FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=/api
ARG VITE_FRONTEND_ERROR_LOGGING_ENABLED=true

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_FRONTEND_ERROR_LOGGING_ENABLED=$VITE_FRONTEND_ERROR_LOGGING_ENABLED

RUN npm run build

FROM caddy:2-alpine

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
