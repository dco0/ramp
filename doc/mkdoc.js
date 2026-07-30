import { marked } from "marked";
import * as fs from "node:fs";
import * as path from "node:path";

if (!fs.existsSync("dist/writeups")) fs.mkdirSync("dist/writeups");

const markedOptions = {
    gfm: true
}

function compileMD(infile, outfile) {
    const html = marked.parse(fs.readFileSync(infile, {encoding: "utf-8"}), markedOptions);
    fs.writeFileSync(outfile, `
    <!DOCTYPE html>
    <html lang="en">
    <head>
    <title>RAMP</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="theme.css" />
    </head>
    <body>
    ${html}
    </body>
    </html>
    `);
}

compileMD("README.md", "dist/index.html");
compileMD("doc/writeups/index.md", "dist/writeups/index.html");
fs.globSync("doc/writeups/*.pdf").forEach((file) => {
    fs.copyFileSync(file, path.join("dist/writeups", path.relative("doc/writeups", file)));
});
fs.copyFileSync("doc/terms.yml", "dist/terms.yml");
