import { exec } from "child_process";
import multer from "multer";
import { NextApiRequest, NextApiResponse } from "next";
import nc from "next-connect";
import { log, prisma } from "../../src/db";

interface File {
    filename: string,
    path: string
}

interface UploadRequest extends NextApiRequest {
    file: File
}

async function completeProblem(problem_id: string, problem_points: number, username: string) {
    // check if the user has already completed this problem
    const completed = await prisma.user.findUnique({
        where: {
            name: username
        },
        select: {
            solved_problems: {
                select: {
                    id: true
                }
            },
        }
    });

    // if the user has already completed this problem, return to avoid duplicate points
    if (completed.solved_problems.find((problem) => problem.id === problem_id)) { return; }

    // update the database record for the user
    await prisma.user.update({
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
}

async function checkCase(inputs: string[], outputs: string[], type: string, path: string) {
    // execute file with exec and feed inputs to istringt. after it finishes, read the stdout.
    // if the output is correct, return true.
    // if the output is incorrect, return false.
    const result: string = await new Promise((resolve, _reject) => {
        const proc = exec(`python3 ${path}`, {
            timeout: 500, // 1 second
            maxBuffer: 5 * 1024 * 1024, // 5MB
        }, (_err, stdout, _stderr) => {
            resolve(stdout);
        });
        for (const input in inputs) {
            proc.stdin.write(inputs[input] + "\n");
        }
    });

    // log and check final result8
    // if the type is a string, the entire outputs array can be joined and matched as a chunk
    // otherwise, iterate through each line of result output, parse it, and compare it with the relevant output element
    let res: boolean = true;
    if (type == "str") {
        res = (result.trim() == outputs.join("\n"))
    } else {
        let lines = result.trim().split("\n");
        for (const i in lines) {
            let ln = lines[i];
            let lnres = false;
            if (type == "int") {
                lnres = parseInt(ln) === parseInt(outputs[i])
            } else if (type == "float") {
                lnres = Math.abs(parseFloat(ln) - parseFloat(outputs[i])) < 8.38e-8
            }

            if (lnres == false) {
                res = false;
                break;
            }
        }
    }
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
            id: id
        },
        select: {
            test_cases: true,
            id: true,
            points: true
        }
    });
    const cases: any = problem.test_cases;

    // Test each case
    for (const case_name in cases) {

        const this_case = cases[case_name];
        log.info(`Checking case '${case_name}'...`);

        if (!(await checkCase(this_case.inputs, this_case.outputs, this_case.type, file.path))) {
            res.redirect(`/problem/${id}/?ctx=graded_false`);
            log.info(`${name} failed problem #${id}`);
            return;
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
