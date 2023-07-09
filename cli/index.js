// this CLI should be used to initially create problems with set test and example cases.
// it's also great for generating single cases and adding users
// the prompt should look as following:
// name: ...
// desc: ...
// example_cases: -> case maker
// test_cases: -> case maker
// created problem ==> databse
const prompt = require("prompts");
const { program } = require("commander");
const sha256 = require("crypto-js/sha256");
const PrismaClient = require("@prisma/client").PrismaClient;
const client = new PrismaClient();

program.option("-s, --single", "create a single case").option("-u, --user", "create a new user").parse();
const options = program.opts();

if (options["single"]) {
    (async () => {
        console.log("Entering single case mode.");
        let cases = await makeCase();
        console.log(JSON.stringify(cases));
    })();
} else if (options["user"]) {
    (async () => {
        let p = await prompt([
            { type: "text", name: "name", message: "Username" }, { type: "text", name: "password", message: "Password" }, { type: "number", name: "team", message: "Team number" }
        ]);
        console.log("Adding user...");
        let pass = sha256(p.password).toString();
        await client.user.create({
            data: {
                name: p.name,
                password: pass,
                team: p.team,
            }
        });
        console.log("Done!");
    })();
} else {
    (async () => {
        let p = await prompt([
            {
                type: "text",
                name: "name",
                message: "Name",
            },
            {
                type: "text",
                name: "desc",
                message: "Description",
            },
            {
                type: "number",
                name: "points",
                message: "Problem points",
            },
            {
                type: "number",
                name: "diff",
                message: "Problem difficulty",
            }
        ]);
        console.log("Create example cases:");
        let examples = await makeCase();
        console.log("Create test cases:");
        let tests = await makeCase();
        console.log("Creating problem...");
        let res = await client.problem.create({
            data: {
                name: p.name,
                description: p.desc,
                points: p.points,
                difficulty: p.diff,
                example_cases: examples,
                test_cases: tests,

            }
        });
        console.log(res);
        client.$disconnect();
    })();
}

// format: cases = {case{n}: {inputs: [], outputs: [], type: str}}
// type can be: int, f32, f64, and str
async function makeCase() {
    let cases = {};
    let n = 0;

    while (true) {
        let c = await prompt([{
            type: "list",
            name: "inputs",
            message: "Case inputs, seperated by pipes (|)",
            separator: "|",
        }, {
            type: "list",
            name: "outputs",
            message: "Case outputs, seperated by pipes (|)",
            separator: "|",
        }, {
            type: "select",
            name: "type",
            message: "Case output type",
            choices: [
                { value: "int" },
                { value: "float" },
                { value: "str" },
            ]
        }, {
            type: "toggle",
            name: "continue",
            message: "Continue?",
            active: "yes",
            inactive: "no",
        }]);
        let cont = c.continue;
        delete c.continue
        cases[`case${n}`] = c;

        if (!cont) {
            break;
        }

        n++;
    }
    return cases;
}