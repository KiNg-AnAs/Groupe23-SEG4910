# Use official Node image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and install deps
COPY frontend/package*.json ./
RUN npm install

# Copy the rest of the frontend code
COPY frontend/ ./

# Expose the dev server port
EXPOSE 3000

# Run the development server
CMD ["npm", "start"]
