import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../src/db";

export default async function UserHasCompleted(req: NextApiRequest, res: NextApiResponse) {
    // get params from url
    let name = req.query.u as string;
    let pid = req.query.p as string;

    // bail if the parameters are incorrect
    if (!name || !pid) {
        res.status(400).json({ error: "incorrect paramters" });
        return;
    }

    // get user model in which paramters are satisfied
    let model = await prisma.user.findFirst({
        where: {
            name: name,
            solved_problems: {
                some: {
                    id: pid,
                }
            }
        }
    });
    let completed = model ? true : false;

    res.status(200).json({ completed });
}