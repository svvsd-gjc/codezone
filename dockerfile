# Pull the node docker image
FROM node:lts-bullseye

# Install required packages
RUN apt update && \
    apt install -y python3 openssl

# Set working directory
WORKDIR /CodeZone
COPY ./ /CodeZone

# Expose neccesary ports
EXPOSE 3000 5555

# Add secure user
RUN groupadd secure
RUN useradd -u 65533 -g secure cz

# Start the server on launch
ENTRYPOINT npm i && npx next lint --fix && npx next start 
