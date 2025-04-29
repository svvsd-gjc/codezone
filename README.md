## Getting Started

### To get the dev server started, run:

```bash
npm i
npm run dev
```

This will create a local Prisma database located in `./prisma/data.db`.
While this local database approach is not the best for scaling, it should be able to handle a few hundred users at a time.

If you'd like to use Docker, you can do the following:

### To get the production server started: 

To start using Docker look at [dockerusage.md](dockerusage.md)

## Configuring CodeZone/CodeComp

See `code-comp.json`, all configurable values should be included there.
There are also several parameters specified by the `.env` file. These include:
- `MONGO_URL`: database URL
- `NEXTAUTH_URL`: base URL that the website will use for authentication routes
  - Be sure that this URL goes towards your outward-facing URL **and** port. For example, if I were hosting the website on `192.168.0.1` on port `80`, this value should be set to `http://192.168.0.1:80`.
- `NEXTAUTH_SECRET`: authentication secret
- `JWT_SECRET`: JWT encryption secret
