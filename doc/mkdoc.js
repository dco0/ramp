import { marked } from "marked";
import { readFileSync, writeFileSync } from "node:fs";

const markedOptions = {
    gfm: true
}

const html = marked.parse(readFileSync("README.md", {encoding: "utf-8"}), markedOptions);
writeFileSync("dist/index.html", `
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
