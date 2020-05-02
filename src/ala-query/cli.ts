#!/usr/bin/env node
const alasql = require("alasql");
import {StringReceiver} from "helper-ios";
import {pipeline} from "stream";
import {promisify} from "util";

const piplinePS = promisify(pipeline);

const query = process.argv[2];
if (!query) {
    console.error("query is missing");
    process.exit(1);
}

async function run(query: string) {
   const sr = new StringReceiver();
   await piplinePS(process.stdin, sr);
   const json = sr.text;
   const data = JSON.parse(json);
   return alasql(query, [data]);
}

run(query)
.then((ret) => {
    process.stdout.write(JSON.stringify(ret));
    process.exit(0);
}).catch((e) => {
    console.error(e);
    process.exit(1);
});