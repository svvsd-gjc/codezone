# Getting Started
Using Docker is highly reccomended, because it smoothes out issues with different node and platform versions. Without Docker, or in a dev-container, the following commands can be used to spin up a development server:
```bash
# install packages.
npm i

# start development server.
npm run dev
```
The development server hot-reloads, meaning you can change files in your editor and see results in your browser window without reloads. By default, the server lives at `http://localhost:3000`.

## Environment
Some environment variables are required for CodeZone to work correctly. An example `.env` file is listed below:
```env
# mongo database url. most providers will have a guide on how to obtain & authenticate one of these.
MONGO_URL=<url>

# this IP and port should be the same as the one the website is being hosted on.
# - on localhost, this is *usually* http://0.0.0.0:3000.
# - if hosting elsewhere, supply the origin IP and port.
NEXTAUTH_URL=http://<ip>:<port>

# secrets. generate these randomly.
NEXTAUTH_SECRET=<secret>
JWT_SECRET=<secret>
```

## Production
To run the server in production mode, the following commands may be used, in a scenario where all prerequisites are met:
```bash
npx next build
npx next start
```
Docker, which is the reccomended solution for production environments, is documented in [this](dockerusage.md) file.

## Adding problems and users
A CLI tool exists to add problems and users to the attached database. See [this](cli/README.md) file for more information.

## Configuring CodeZone
See ```code-comp.json```, all configurable values should be included there.
