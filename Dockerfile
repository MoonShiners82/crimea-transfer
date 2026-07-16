FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx prisma generate

RUN NODE_OPTIONS="--max-old-space-size=1024" npm run build

EXPOSE 3000

CMD ["npm", "start"]
