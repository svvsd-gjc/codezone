// format: cases = {case{n}: {inputs: [], outputs: [], type: str}}
// type can be: int, f32, f64, and str
const prompt = require("prompts");
(async () => {
    let cases = {};
    let n = 0;

    while (true) {
        let c = await prompt([{
            type: "list",
            name: "inputs",
            message: "Case inputs, seperated by commas",
        }, {
            type: "list",
            name: "outputs",
            message: "Case outputs, seperated by commas",
        }, {
            type: "select",
            name: "type",
            message: "Case output type",
            choices: [
                { value: "int" },
                { value: "f32" },
                { value: "f64" },
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
    console.log(JSON.stringify(cases));
})();