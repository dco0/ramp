import { marked } from "marked";
import * as fs from "node:fs";
import * as path from "node:path";

const markedOptions = {
    gfm: true
}

const html = marked.parse(fs.readFileSync("README.md", {encoding: "utf-8"}), markedOptions);
fs.writeFileSync("dist/index.html", `
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

if (!fs.existsSync("dist/writeups")) fs.mkdirSync("dist/writeups");
fs.globSync("doc/writeups/*.pdf").forEach((file) => {
    fs.copyFileSync(file, path.join("dist/writeups", path.relative("doc/writeups", file)));
});
