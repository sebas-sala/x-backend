# BASE IMAGE
FROM node:22.5.1-alpine3.20 as base

ENV DIR /app
WORKDIR $DIR

COPY package*.json ./

RUN npm install

COPY . .

# DEVELOPMENT
FROM base AS dev

ENV NODE_ENV=development

EXPOSE $PORT
CMD ["npm", "run", "dev"]

# BUILD
FROM base AS build
RUN npm run build && npm prune --production

# PRODUCTION
FROM node:22.5.1-alpine3.20 as prod

ENV NODE_ENV=production
ENV USER=node

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

RUN chown -R node:node /app 
RUN apk add --no-cache dumb-init

USER $USER
EXPOSE $PORT
CMD ["dumb-init", "node", "dist/main.js"]
