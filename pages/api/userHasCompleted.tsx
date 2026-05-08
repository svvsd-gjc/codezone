import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../src/db";

export default async function UserHasCompleted(req: NextApiRequest, res: NextApiResponse) {
    // get params from url
    const name = req.query.u as string;
    const pid = req.query.p as string;

    // bail if the parameters are incorrect
    if (!name || !pid) {
        res.status(400).json({ error: "incorrect paramters" });
        return;
    }

    // get user model in which paramters are satisfied
    const model = await prisma.user.findFirst({
        where: {
            name: name,
            solved_problems: {
                some: {
                    id: pid,
                }
            }
        }
    });
    const completed = model ? true : false;

    res.status(200).json({ completed });
}