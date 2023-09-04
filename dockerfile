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

# Add secure group
RUN groupadd secure

# Make `secure` group own uploads, and restrict to read-only.
RUN chown :secure ./uploads
RUN chmod 555 ./uploads

# Add the CodeZone user
RUN useradd -u 65533 -g secure cz

# Start the server on launch
ENTRYPOINT npm i && npx next lint --fix && npx next build && npx next start 
