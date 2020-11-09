const path = require("path");

module.exports = {
    entry: "./src/client/script.ts",
    devtool: "inline-source-map",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "./dist/client"),
    },
    watchOptions: {
        aggregateTimeout: 100,
        poll: 1000,
    },
    mode: "development",
};
