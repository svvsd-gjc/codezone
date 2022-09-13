import { NextApiRequest, NextApiResponse } from "next";
import nc from "next-connect";
import multer from "multer";
import { exec, spawn } from "child_process";
import { prisma } from "../../src/db";

interface File {
    filename: string,
    path: string
}

interface UploadRequest extends NextApiRequest {
    file: File
}

async function completeProblem(problem_id: number, problem_pts: number, username: string) {

    // Recalculate the user's points to retain accuracy
    let user = await prisma.account.findUnique({
        where: {
            name: username
        },
        include: {
            solved_problems: true
        }
    });

    // Update the database record for the user
    let update = await prisma.account.update({
        where: {
            name: username
        },
        data: {
            solved_problems: {
                connect: {
                    id: problem_id
                }
            }
        }
    });

    console.log("[+] Added problem solve connector");

    // Re-pull the user account
    user = await prisma.account.findUnique({
        where: {
            name: username
        },
        include: {
            solved_problems: true
        }
    });

    // Check if problem id is already solved
    let total_pts = 0;
    for (let i = 0; i < user.solved_problems.length; i++) {
        total_pts += user.solved_problems[i].points;
    }

    // Update user again
    update = await prisma.account.update({
        where: {
            name: username
        },
        data: {
            points: {
                set: total_pts
            }
        }
    });

    console.log("[+] Recalculated points, resolved to " + total_pts);

    return update;
}

async function checkCase(inputs: any, output: any, type: string, path: any) {
    // execute file with exec and feed inputs to it. after it finishes, read the stdout.
    // if the output is correct, return true.
    // if the output is incorrect, return false.
    let result: string = await new Promise((resolve, reject) => {
        const proc = exec(`python3 ${path}`, {
            timeout: 500, // 1 second
            maxBuffer: 5 * 1024 * 1024, // 5MB
        }, (err, stdout, stderr) => {
            if (err) {
                resolve(stdout);
            } else {
                resolve(stdout);
            }
        });
        for (const input in inputs) {
            proc.stdin.write(inputs[input] + "\n");
        }
    });
    // Trim outputs
    result = result.trim();
    // Log and check final result
    let res;
    if (type == "number") {
        res = Math.abs(parseFloat(result) - parseFloat(output)) < 0.001;
    } else {
        res = (result === output.join("\n"));
    }
    console.log("[+] Expected " + output + ", got " + result + ". Resolved to: " + res);
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
        if (!file.originalname.match(/\.(py|pyc|txt)$/)) {
            return cb(new Error("Only .py, .pyc and .txt files are allowed!"), false);
        }
        cb(null, true);
    }
});

const api = nc<UploadRequest, NextApiResponse>({
    onError: (err, req, res, next) => {
        console.log(err.stack);
        res.statusCode = 500;
        res.statusMessage = "Oops, something went wrong!";
    },
    onNoMatch: (req, res) => {
        res.statusCode = 404;
        res.statusMessage = "Not found!";
    }
});

api.use(upload.single("uploaded_file"));

api.post(async (req, res) =>{

    const id: string = req.query.p as string;
    const name: string = req.query.u as string;
    const file = req.file;

    console.log(`[+] User "${name}" attempting p${id}`);

    // Fetch information from database
    const problem = await prisma.problem.findUnique({
        where: {
            id: id
        }
    });
    const user = await prisma.account.findUnique({
        where: {
            name: name
        }
    });
    const cases_obj = JSON.parse(problem.test_cases);

    console.log(`[+] Got file: ${req.file.filename}`);

    let cases_solved = 0;
    for (const case_name in cases_obj) {

        const this_case = cases_obj[case_name];
        console.log("[+] Checking case...");

        if (!(await checkCase(this_case.inputs, this_case.outputs, this_case.type, file.path))) {
            console.log("[++] " + name + " submitted " + id + " (false)");
            res.redirect(`/problem?p=${id}&ctx=graded_false`);
            break;
        } else {
            cases_solved++;
        }

    }

    // If all of the test cases passed, complete the problem
    if (cases_solved === Object.keys(cases_obj).length) {
        completeProblem(problem.id, problem.points, name);
        console.log("[++] " + name + " submitted " + id + " (true)");
        res.redirect(`/problem?p=${id}&ctx=graded_true`);
    }

});

export default api;

export const config = {
    api: {
        bodyParser: false // Cosume data as stream
    }
};
