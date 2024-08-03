FROM node:22.5.1-alpine3.20 as base

ENV DIR /app
WORKDIR $DIR

COPY . .

RUN npm install

# DEVELOPMENT
FROM base AS dev

ENV NODE_ENV=development

EXPOSE $PORT
CMD ["npm", "run", "dev"]

# BUILD
FROM base AS build

RUN apk add --no-cache dumb-init

RUN npm run build && npm prune --production

# PRODUCTION
FROM node:22.5.1-alpine3.20 as prod

ENV NODE_ENV=production
ENV USER=node

WORKDIR /app

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

RUN apk add --no-cache dumb-init

USER $USER
EXPOSE $PORT
CMD ["dumb-init", "node", "dist/main.js"]
