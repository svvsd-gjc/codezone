FROM node:17.8-bullseye-slim 
EXPOSE 3000

ARG ssh_prv_key
ARG ssh_pub_key

RUN useradd -u 65533 codezone_participant
RUN apt-get update || : && apt-get install python3 git -y
RUN git clone ssh://git@git.jetbrains.space/cybertechteam/cz/CodeZone.git
WORKDIR /home/code
RUN npx next lint --fix
RUN npx next build
CMD npx next start
ENTRYPOINT npx next start
