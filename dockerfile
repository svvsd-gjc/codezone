FROM node:17.8-bullseye-slim 
EXPOSE 3000

ARG ssh_prv_key
ARG ssh_pub_key

RUN apt-get update && \
    apt-get install -y \
        python3 \
        git \
        openssh-server 

RUN mkdir -p /root/.ssh && \
    chmod 700 /root/.ssh && \
    echo "git.jetbrains.space ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCa5qcmbt2HCiQb54RrOXIsYLV+fbowckyuhZqe/IALABRjiCPzg3VvOB6lCcjyMf2aOW6q6bJfMGSPEX7B+/Wg0VX0F9YW7eE0PbuxbuWlEETokOJdoIh0/EiHTJF9uQmN5A0izVB8N/jigJbETo9XShaTRV5uHBZdGF3/5zHH/uzQRJCzSTdDzKKzIZQOHm37kmXZT6fuS1VAGfW/otJrZ1U//UEM9hcdFLfj5CxlbbG25bswzdyq99iQoF6Neachh+W+w3tpSydt8BK+NEwUVN/0iJt84SwkC3e9PHRZPJBsr9svjVRgUgbIUc8/xvD/b9F0i6dN78v48D0zQmMx" > /root/.ssh/known_hosts

RUN echo $ssh_prv_key > /root/.ssh/id_rsa && \
    echo $ssh_pub_key > /root/.ssh/id_rsa.pub && \
    chmod 700 /root/.ssh/id_rsa && \
    chmod 700 /root/.ssh/id_rsa.pub

RUN useradd -u 65533 codezone_participant
WORKDIR /CodeZone
RUN git clone ssh://git@git.jetbrains.space/cybertechteam/cz/CodeZone.git
WORKDIR /CodeZone/CodeZone
RUN npx next lint --fix
RUN npx next build
CMD npx next start
ENTRYPOINT npx next start
