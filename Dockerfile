FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY . .

EXPOSE 8000

# tsx runs TypeScript directly - handles ALL path aliases perfectly
CMD ["npx", "tsx", "src/index.ts"]
