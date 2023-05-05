const PrismaClient = require("@prisma/client").PrismaClient;

// this script is designed to remove all problem account_ids and all users except for organizers
// use before running competitions, or any time you need to remove all users but retain problems

(async () => {
    const client = new PrismaClient();

    // delete all users
    await client.user.deleteMany({
        where: {
            NOT: {
                organizer: true
            }
        }
    });

    // remove all problem account_ids
    await client.problem.updateMany({
        data: {
            account_ids: []
        }
    })

    await client.$disconnect();
})();
