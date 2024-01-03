/**
 * @fileoverview Header parser for problem files
 */

class Header {
    constructor(headerContent) {
        // initialize variables
        this.name = "";
        this.desc = "";
        this.points = -1;
        this.difficulty = -1;
        this.examples = [];
        this.tests = [];
        this.type = "str";

        // parse header content
        let lines = headerContent.match(/#(\*\*)[\s\S]*#(\*\*)/g)[0];
        lines = lines.replace(/#(\*\*)/g, "");
        lines = lines.trim().split("\n");
        for (let line of lines) {
            // split the line into the key and the content
            let [key, ...content] = line.split(" ");
            content = content.join(" ");
            key = key.substring(1);

            // if the key is invalid, throw an error
            if (!this.hasOwnProperty(key)) {
                throw new Error(`Invalid header key: ${key}`);
            }

            // in the case of examples or tests, we need to split the content,
            // first by comma, then by pipe
            if (key === "examples" || key === "tests") {
                content = content.split(",");
                content = content.map((c) => c.split("|"));
            }

            // then, set the key to the content
            this[key] = content;
        }

        // make sure we have all forms
        if (!this.hasAllForms()) {
            throw new Error("Missing header forms");
        }
    }
    hasAllForms() {
        return this.name && this.desc && this.points && this.difficulty && this.examples && this.tests;
    }
}
exports.Header = Header;
