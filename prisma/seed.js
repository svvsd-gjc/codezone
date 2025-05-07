const PrismaClient = require("@prisma/client").PrismaClient;

(async () => {
    const client = new PrismaClient();

    // add root user
    await client.user.upsert({
        where: { name: "root" },
        update: {
            points: 0,
        },
        create: {
            name: "root",
            password: "4813494d137e1631bba301d5acab6e7bb7aa74ce1185d456565ef51d737677b2",
        }
    });

    // add basic problems
    await client.problem.create({
        data: {
            name: "Sum",
            description: "Add the two numbers together and print the result.",
            difficulty: 1,
            points: 1,
            example_cases: {
                case0: {
                    inputs: ["1", "2"],
                    outputs: ["3"],
                    type: "int",
                }
            },
            test_cases: {
                case0: {
                    inputs: ["1", "2"],
                    outputs: ["3"],
                    type: "int",
                },
            }
        }
    });


    await client.$disconnect();
})();
