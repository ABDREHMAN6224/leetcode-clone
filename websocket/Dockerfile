FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN ["npm", "install", "-g", "typescript"]
COPY . .
EXPOSE 8080
CMD ["npm", "run", "dev"]