import { NextApiRequest, NextApiResponse } from "next";
import nc from "next-connect";
import multer from "multer";
import { exec } from "child_process";
import { prisma, log } from "../../src/db";

interface File {
    filename: string,
    path: string
}

interface UploadRequest extends NextApiRequest {
    file: File
}

async function completeProblem(problem_id: number, problem_points: number, username: string) {
    // Update the database record for the user
    let update = prisma.account.update({
        where: {
            name: username
        },
        data: {
            points: {
                increment: problem_points
            },
            solved_problems: {
                connect: {
                    id: problem_id
                }
            }
        }
    });

    return update;
}

async function checkCase(inputs: any, output: any, type: string, path: string) {
    // execute file with exec and feed inputs to it. after it finishes, read the stdout.
    // if the output is correct, return true.
    // if the output is incorrect, return false.
    let result: string = await new Promise((resolve, reject) => {
        const proc = exec(`python3 ${path}`, {
            timeout: 500, // 1 second
            maxBuffer: 5 * 1024 * 1024, // 5MB
        }, (err, stdout, stderr) => {
            resolve(stdout);
        });
        for (const input in inputs) {
            proc.stdin.write(inputs[input] + "\n");
        }
    });

    // Log and check final result
    let res: boolean;
    if (type == "number") {
        res = Math.abs(parseFloat(result) - parseFloat(output)) < 0.001;
    } else {
        res = (result === output.join("\n"));
    }
    log.debug(`Got '${result}', expected '${output}'`);
    return res;
}

const upload = multer({
    dest: "./uploads/",
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
    limits: {
        fileSize: 10000
    },
    fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(py|txt)$/)) {
            return cb(new Error("Only .py, .pyc and .txt files are allowed!"), false);
        }
        cb(null, true);
    }
});

const api = nc<UploadRequest, NextApiResponse>({
    onError: (err, req, res, next) => {
        log.info(err.stack);
        res.statusCode = 500;
        res.statusMessage = "Oops, something went wrong!";
    },
    onNoMatch: (req, res) => {
        res.statusCode = 404;
        res.statusMessage = "Not found!";
    }
});

api.use(upload.single("uploaded_file"));

api.post(async (req, res) => {
    const id: string = req.query.p as string;
    const name: string = req.query.u as string;
    const file = req.file;

    log.info(`User ${name} attempting problem #${id} ('${file.filename}')`);

    // Fetch information from database
    const problem = await prisma.problem.findUnique({
        where: {
            id: parseInt(id)
        },
        select: {
            test_cases: true,
            id: true,
            points: true
        }
    });
    const cases = JSON.parse(problem.test_cases);

    // Test each case
    for (const case_name in cases) {

        const this_case = cases[case_name];
        log.info(`Checking case '${case_name}'...`);

        if (!(await checkCase(this_case.inputs, this_case.outputs, this_case.type, file.path))) {
            res.redirect(`/problem/${id}/?ctx=graded_false`);
            log.info(`${name} failed problem #${id}`);
            break;
        }
    }

    // If all of the test cases passed, complete the problem
    completeProblem(problem.id, problem.points, name);
    log.info(`${name} completed problem #${id}`);
    res.redirect(`/problem/${id}/?ctx=graded_true`);
});

export default api;

export const config = {
    api: {
        bodyParser: false // Cosume data as stream
    }
};
