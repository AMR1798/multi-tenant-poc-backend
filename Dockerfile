# Stage 1: Build
FROM node:lts-alpine AS build

WORKDIR /usr/src/node-app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npx prisma generate

RUN npm run build

# Stage 2: Development
FROM build AS development

ENV NODE_ENV=development

EXPOSE 3000

CMD ["npm", "run", "dev"]

# Stage 3: Production
FROM node:lts-alpine AS production

WORKDIR /usr/src/node-app

COPY --from=build /usr/src/node-app/ ./

RUN npm prune --production

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]
