## Getting Started

To get the dev server started, run:

```bash
npm i
npx prisma db push
npm run dev
```

This will create a local Prisma database located in `./prisma/data.db`.
While this local database approach is not the best for scaling, it should be able to handle a few hundred users at a time.

If you'd like to use Docker, you can do the following:

```bash
sudo docker run --name=codezone -p 3000:3000 -p 5555:5555 kylandodds/webserver:latest
```

The server will host on https://localhost:3000.

## Configuring CodeZone/CodeComp

See ```code-comp.json```, all configurable values should be included there.
