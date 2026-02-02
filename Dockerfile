FROM node:25

# Set the working directory in the container
WORKDIR /app

RUN apt update && apt install -y jq

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Define the command to run the application
CMD ["npm", "start"]

