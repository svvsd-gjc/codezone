FROM node:17.8-bullseye-slim 
EXPOSE 3000

ARG ssh_prv_key
ARG ssh_pub_key

RUN apt-get update && \
    apt-get install -y \
        git \
        openssh-server 

RUN mkdir -p /root/.ssh && \
    chmod 0700 /root/.ssh && \
    ssh-keyscan github.com > /root/.ssh/known_hosts

RUN echo "$ssh_prv_key" > /root/.ssh/id_rsa && \
    echo "$ssh_pub_key" > /root/.ssh/id_rsa.pub && \
    chmod 600 /root/.ssh/id_rsa && \
    chmod 600 /root/.ssh/id_rsa.pub

RUN useradd -u 65533 codezone_participant
RUN apt-get update || : && apt-get install python3 git -y
RUN git clone ssh://git@git.jetbrains.space/cybertechteam/cz/CodeZone.git
WORKDIR /home/code
RUN npx next lint --fix
RUN npx next build
CMD npx next start
ENTRYPOINT npx next start
