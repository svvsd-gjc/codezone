// this CLI should be used to initially create problems with set test and example cases.
// it's also great for generating single cases and adding users
const prompt = require("prompts");
const { program } = require("commander");
const { exec } = require("child_process");
const fs = require("fs/promises");
const sha256 = require("crypto-js/sha256");
const { Prisma } = require("@prisma/client");
const { Header } = require("./header");
const PrismaClient = require("@prisma/client").PrismaClient;
const client = new PrismaClient();

let add = program.command("add").description("add data to source database");
add.command("file <file>").description("add a problem to the database from a problem source file").action(async (file) => {
    // when adding files, there is a required header that will determine how the problem gets added
    // this header is in the form of a comment, and should be formatted like this:
    // *test and example inputs follow the format, where a comma seperates cases, and a pipe seperates inputs: a|b|c,a|b|c
    //
    // #**
    // #name <name>
    // #desc <description>
    // #points <points>
    // #difficulty <difficulty>
    // #examples <example inputs>
    // #tests <test inputs>
    // #**
    //

    // parse file and header
    let file_content = await fs.readFile(file, "utf-8");
    let header = new Header(file_content);

    // generate cases from header
    let gen_cases = async (inputs) => {
        let tmp = {};
        await Promise.all(inputs.map(async (input, i) => {
            await runWithInputs(file, input).then(async (out) => {
                tmp[`case${i}`] = {
                    inputs: input,
                    outputs: out,
                    type: inferType(out),
                };
            });
        }));
        return tmp;
    }
    header.examples = await gen_cases(header.examples);
    header.tests = await gen_cases(header.tests);;

    // confirm with user
    console.log(JSON.stringify(header, null, 4));
    let confirm = await prompt({
        type: "toggle",
        name: "confirm",
        message: "Confirm?",
        active: "yes",
        inactive: "no",
    });
    if (!confirm.confirm) {
        console.log("Aborting...");
        process.exit(0);
    } else {
        console.log("Adding problem...");
        client.problem.create({
            data: {
                name: header.name,
                description: header.desc,
                points: Number.parseInt(header.points),
                difficulty: Number.parseInt(header.difficulty),
                example_cases: header.examples,
                test_cases: header.tests,
            }
        }).then((res) => {
            client.$disconnect();
        });
    }
})
add.command("user <name> <password> <team>").description("add a user to the database").action(async (name, password, team) => {
    (async () => {
        /* let p = await prompt([
            { type: "text", name: "name", message: "Username" }, { type: "text", name: "password", message: "Password" }, { type: "number", name: "team", message: "Team number" }
        ]); */
        console.log("Adding user...");
        let pass = sha256(password).toString();
        await client.user.create({
            data: {
                name: name,
                password: pass,
                team: parseInt(team), //TODO is this a smart way of doing this?
            }
        });
        console.log("Done!");
    })();
});

let make = program.command("make").description("create data for manual/testing use via prompts, does NOT add to database");
make.command("case").description("create a single case").action(async () => {
    // TODO
})
make.command("problem").description("create a problem and assign test cases manually").action(async () => {
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
        let examples = await makeCaseSetPrompt();
        console.log("Create test cases:");
        let tests = await makeCaseSetPrompt();
        console.log("Creating problem...");
        let res = await client.problem.create({ //TODO this pushes to the database even though the command description claims it does not
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
});

// TODO convert these flags to subcommands, which are already laid out above
// code for these can be found below in the if/else chain regrading the flags

program.option("-s, --single", "create a single case").parse();
const options = program.opts();
if (options["single"]) { /* SINGLE CASE MODE */
    (async () => {
        console.log("Entering single case mode.");
        let cases = await makeCaseSetPrompt();
        console.log(JSON.stringify(cases));
    })();
} 

// utilities

/**
 * Runs the given Python file with the provied inputs and returns the resulting output
 * @param {string} file file path
 * @param {string[]} inputs input lines
 * @returns {string[]} output lines
 */
async function runWithInputs(file, inputs) {
    const result = await new Promise((resolve, reject) => {
        const proc = exec(`python3 -I ${file}`, (err, stdout, stderr) => {
            if (err) {
                reject(err);
            } else if (stderr) {
                reject(stderr);
            } else {
                resolve(stdout);
            }
        });
        for (const input in inputs) {
            proc.stdin.write(inputs[input] + "\n");
        }
    });
    return result.trim().split("\n");
}

/**
 * Generates case set from user prompt
 * @returns case set
 */
async function makeCaseSetPrompt() {
    // create temp variables
    let cases = {};
    let n = 0;

    while (true) {
        // prompt the user for inputs. the resulting format
        // will already be the right shape to put in the output,
        // so no need to change anything
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

        // remove `continue` from the case, as we
        // won't want to include it in the output
        let cont = c.continue;
        delete c.continue;

        // add generated case to cases
        cases[`case${n}`] = c;

        // if we're done, end the loop here. otherwise,
        // keep running
        if (!cont) {
            break;
        }
        n++;
    }

    // once the loop has terminated, we're done, and we can return the generated case set
    return cases;
}

/**
 * Infers the type of the given output.
 * @param {string} output 
 * @returns {"int"|"float"|"str"}
 */
function inferType(output) {
    // if the output can be cast to a number, it's either an int or a float
    k = Number.parseFloat(output);
    if (!Number.isNaN(k)) {
        // if the number is an integer, it's an int. otherwise, it's a float
        if (Number.isInteger(k)) {
            return "int";
        } else {
            return "float";
        }
    } else {
        // otherwise, it's a string
        return "str";
    }
}