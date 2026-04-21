# Use a lightweight Node.js image
FROM node:24-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY package.json ./
RUN npm install

# Copy the rest of the application code
COPY index.js .

# Start the application
CMD ["node", "index.js"]