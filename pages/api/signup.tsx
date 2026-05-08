import { NextApiRequest, NextApiResponse } from "next";
import nc from "next-connect";
import config from "../../code-comp.json";
import { prisma } from "../../src/db";
import { validateUsername, validatePassword } from "../../lib/validators";

const api = nc<NextApiRequest, NextApiResponse>({
    onError: (err, req, res, next) => {
        res.status(500).json({ statusCode: 500, message: "Uh oh! Something broke. Tell the devs, we'll fix it as soon as we can." });
    },
    onNoMatch: (req, res) => {
        res.status(404).json({ statusCode: 404, message: "Uh oh! We couldn't find the page you were looking for." });
    }
});

api.post((req, res) => {
    if (!config["allow-signups"]) { return res.status(503).json({ statusCode: 503, message: "Signups are not allowed at this time." }); }

    const nameResult = validateUsername(req.body.username, config);
    if (!nameResult.ok) {
        return res.status(400).json({ statusCode: 400, message: nameResult.message });
    }
    const passResult = validatePassword(req.body.password, config);
    if (!passResult.ok) {
        return res.status(400).json({ statusCode: 400, message: passResult.message });
    }

    prisma.user.create({
        data: {
            name: nameResult.value,
            password: passResult.value
        }
    }).then((account) => {
        res.status(200).json({ success: true, name: account.name });
    }).catch((err) => {
        res.status(400).json({ success: false, message: "Failed to create user." });
    });
});

export default api;
