import { prisma } from "../../src/db";
import nc from "next-connect";
const config = require("../../code-comp.json");

const api = nc({
    onError: (req, res, err) => {
        console.log(err.stack);
        res.status(500).json({ statusCode: 500, message: "Uh oh! Something broke. Tell the devs, we'll fix it as soon as we can." });
    },
    onNoMatch: (req, res) => {
        res.status(404).json({ statusCode: 404, message: "Uh oh! We couldn't find the page you were looking for." });
    }
});

api.post((req, res) => {
    let sanitizedName = req.body.username.trim();
    let sanitizedPass = req.body.password.trim();

    // Check that the sanitized name fits restrictions applied by the configuration
    if (sanitizedName.length < config["username-len-min"]) {
        return res.status(400).json({ statusCode: 400, message: `Name must be at least ${config["username-len-min"]} characters long.` });
    } else if (sanitizedName.length > config["username-len-max"]) {
        return res.status(400).json({ statusCode: 400, message: `Name must be less than ${config["username-len-max"]} characters long.` });
    } else if (sanitizedName.match(/[^a-zA-Z0-9_]/)) {
        return res.status(400).json({ statusCode: 400, message: "Name can only contain letters, numbers, and underscores." });
    }

    // Check that the password fits restrictions applied by the configuration
    if (sanitizedPass < config["password-len-min"]) {
        return res.status(400).json({ statusCode: 400, message: `Password must be at least ${config["username-len-min"]} characters long.` });
    } else if (sanitizedName > config["password-len-max"]) {
        return res.status(400).json({ statusCode: 400, message: `Password must be less than ${config["username-len-max"]} characters long.` });
    } else if (sanitizedName.match(/[^a-zA-Z0-9_]/)) {
        return res.status(400).json({ statusCode: 400, message: "Password can only contain letters, numbers, and underscores." });
    }

    // Call database and request account creation
    prisma.account.create({
        data: {
            name: sanitizedName,
            password: sanitizedPass
        }
    }).then((account) => {
        res.status(200).json({success: true, name: account.name});
    }).catch((err) => {
        res.status(400).json({success: false, message: "Failed to create user."});
    }); 
});

export default api;
