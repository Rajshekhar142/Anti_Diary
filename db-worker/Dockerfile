# Use a lightweight Node.js image
FROM node:24-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Start the application
CMD ["npx", "tsx", "index.ts"]