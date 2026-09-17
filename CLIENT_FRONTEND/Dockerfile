# Use the latest LTS version of Node.js
FROM node:24-alpine
 
# Set the working directory inside the container
WORKDIR /app
 
# Copy package.json and package-lock.json file
# in the working directory.
COPY package*.json ./
 
# Install dependencies
RUN npm install
 
# Copy the rest of the application files in the working directory
COPY . .
 
# Build once when building the image
RUN npm run build

# Build once when building the image
# This Removes node_modules and install all dependencies at once 
# https://stackoverflow.com/questions/52499617/what-is-the-difference-between-npm-install-and-npm-ci
# RUN nup run ci 

# Expose the port the app runs on
EXPOSE 4173
 
# Define the command to run your app
# CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "4173"]

# Define the command to run your app
# "preview" comes from package.json → usually runs "vite preview"
# Vite CLI defines --host and --port options (not Docker)
# By default Vite binds to localhost (127.0.0.1), which is NOT accessible outside the container
# "--host 0.0.0.0" makes the server listen on all container interfaces so Docker can forward traffic
# (forward traffic = Docker receives requests on the host machine port and redirects them to the container’s internal port)
# (the internal port is the port on which the frontend app runs inside the container. this is specified in the CMD command and is 4173)
# "--port 4173" sets the port Vite preview uses (4173 is Vite's default preview port)
# "--" tells npm to forward the following arguments to the underlying Vite command
# Equivalent raw command: npm run preview -- --host 0.0.0.0 --port 4173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]