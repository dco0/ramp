import path from "node:path";

export default {
    mode: "production",
    entry: {
        "tiling": "./build/tiling.js"
    },
    resolve: {
        extensions: [".js"],
    },
    output: {
        filename: "[name].js",
        path: path.resolve(import.meta.dirname, "dist"),
    }
};
