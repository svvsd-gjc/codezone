# Pull the node docker image
FROM node:lts-bullseye
#Expose neccesary ports
EXPOSE 3000 5555

#Install pre-requisites
RUN apt-get update && \
    apt-get install -y \
        python3 

#Add new user
RUN useradd -u 65533 codezone_participant
#Set working directory
WORKDIR /CodeZone
#Start the server on launch
ENTRYPOINT npx next lint --fix && npm run dev 
