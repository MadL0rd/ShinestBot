FROM node:22-alpine

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm ci --legacy-peer-deps
RUN npm i -g @nestjs/cli

# Bundle app source
COPY . .

# Creates a "dist" folder with the production build
RUN NODE_OPTIONS=--max_old_space_size=4096 npm run build

# Start the server using the production build
CMD ["sh", "-c", "node dist/src/main.js"]
