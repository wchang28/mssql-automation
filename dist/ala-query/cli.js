#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var alasql = require("alasql");
var query = process.argv[2];
if (!query) {
    console.error("query is missing");
    process.exit(1);
}
try {
    var json = fs.readFileSync(0, "utf-8");
    var data = JSON.parse(json);
    var ret = alasql(query, [data]);
    process.stdout.write(JSON.stringify(ret));
}
catch (e) {
    console.error(e);
    process.exit(1);
}
//# sourceMappingURL=cli.js.map