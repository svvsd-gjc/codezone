import { exec } from "child_process";
import multer from "multer";
import { NextApiRequest, NextApiResponse } from "next";
import nc from "next-connect";
import { unstable_getServerSession } from "next-auth/next";
import { log, prisma } from "../../src/db";
import codecompcfg from "../../code-comp.json";
import { authOptions } from "./auth/[...nextauth]";
import { compareOutputs, checkCase, type CaseType } from "../../lib/grading";

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
    if (completed?.solved_problems.find((problem) => problem.id === problem_id)) { return; }

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

const upload = multer({
    dest: "./uploads/",
    limits: {
        fileSize: 10000
    },
    fileFilter: (_req, file, cb) => {
        if (!file.originalname.match(/\.(py|txt)$/)) {
            return cb(null, false);
        }
        cb(null, true);
    }
});

const api = nc<UploadRequest, NextApiResponse>({
    onError: (err, _req, res, _next) => {
        log.info(err.stack);
        res.statusCode = 500;
        res.statusMessage = "Oops, something went wrong!";
    },
    onNoMatch: (_req, res) => {
        res.statusCode = 404;
        res.statusMessage = "Not found!";
    }
});

api.use(upload.single("uploaded_file"));

api.post(async (req, res) => {
    const now = performance.now();
    const id: string = req.query.p as string;

    const session = await unstable_getServerSession(req, res, authOptions);
    const name = session?.user?.name;
    if (!name) {
        log.info("Unauthenticated upload attempt, aborting.");
        res.redirect(`/problem/${id}/?ctx=unauthorized`);
        return;
    }

    const file = req.file;

    if (!file) {
        log.info("Encountered null file, aborting.");
        res.redirect(`/problem/${id}/?ctx=nofile`);
        return;
    }

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
    const cases: any = problem?.test_cases;
    if (!problem) {
        return;
    }

    // TODO maybe make this whole thing only use once instance of the python runtime
    // it'd be much faster, but it'd also be more dangerous beacuse of data persistence

    // start each test case asynchronously
    const case_promises: Promise<boolean>[] = [];
    for (const case_name in cases) {
        case_promises.push(checkCase(cases[case_name].inputs, cases[case_name].outputs, cases[case_name].type, file.path));
    }

    // wait for all test cases to complete and check each one
    const results = await Promise.all(case_promises);
    for (const result in results) {
        if (!results[result]) {
            res.redirect(`/problem/${id}/?ctx=graded_false`);
            log.info(`${name} failed problem #${id} in ${performance.now() - now}ms`);
            return;
        }
    }


    // If all of the test cases passed, complete the problem
    completeProblem(problem.id, problem.points, name);
    log.info(`${name} completed problem #${id} in ${performance.now() - now}ms`);
    res.redirect(`/problem/${id}/?ctx=graded_true`);
});

export default api;

export const config = {
    api: {
        bodyParser: false // Cosume data as stream
    }
};
