#!/usr/bin/env node
import * as fs from "fs";
const alasql = require("alasql");

const query = process.argv[2];
if (!query) {
    console.error("query is missing");
    process.exit(1);
}

try {
    const json = fs.readFileSync(0, "utf-8");
    const data = JSON.parse(json);
    const ret = alasql(query, [data]);
    process.stdout.write(JSON.stringify(ret));
} catch (e) {
    console.error(e);
    process.exit(1);
}