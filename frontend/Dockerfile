# Use the official Node.js image as the base image
FROM node:22

# Copy package.json and package-lock.json
COPY package*.json /srv/frontend/

# Set the working directory
WORKDIR /srv/frontend

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . /srv/frontend

# Expose the port the app runs on
EXPOSE 4051

# Command to run the application with --host option
CMD ["npm", "run", "dev", "--", "--host"]