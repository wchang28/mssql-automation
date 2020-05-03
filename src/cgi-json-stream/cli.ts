#!/usr/bin/env node
import * as JSONStream from "JSONStream";
import {CGIIO, StringReceiver} from "helper-ios";
import {ObjectTransformStream} from "object-transform-stream";
import {pipeline} from "stream";
import {promisify} from "util";

const piplinePS = promisify(pipeline);

interface CGIRunParams {
    cmd: string;
    cwd?: string;
    envJSON?: string;
}

const ERROR_NOTHING_TO_RUN = "nothing to run";

function commandArgs2Array(text) {
    const re = /^"[^"]*"$/; // Check if argument is surrounded with double-quotes
    const re2 = /^([^"]|[^"].*?[^"])$/; // Check if argument is NOT surrounded with double-quotes
    let arr = [];
    let argPart = null;
    text && text.split(" ").forEach(function(arg) {
        if ((re.test(arg) || re2.test(arg)) && !argPart) {
            arr.push(arg);
        } else {
            argPart = argPart ? argPart + " " + arg : arg;
            // If part is complete (ends with a double quote), we can add it to the array
            if (/"$/.test(argPart)) {
                arr.push(argPart);
                argPart = null;
            }
        }
    });
    return arr;
}

function parse_cmdline(cmd: string) {
    const args = commandArgs2Array(cmd) as string[];
    return args.map((arg) => {
        if (arg.length >= 2 && arg[0] == '"' && arg[arg.length - 1] == '"') {
            arg = arg.substr(1, arg.length-2);
        }
        return arg;
    });
}

async function run() {
    const cgiRunner = new ObjectTransformStream<CGIRunParams, any>(async (input: CGIRunParams) => {
        try {
            if (!input || !input.cmd) throw ERROR_NOTHING_TO_RUN;
            const args = parse_cmdline(input.cmd);
            if (args.length === 0) throw ERROR_NOTHING_TO_RUN;
            const command = args[0];
            args.shift();
            const cgiIO = new CGIIO(() => {
                const ret: {command: string, args?: string[], cwd?: string, env?: any} = {
                    command
                    ,cwd: input.cwd
                };
                if (args.length > 0) ret.args = args;
                if (input.envJSON) ret.env = JSON.parse(input.envJSON);
                return ret;
            });
            const sr = new StringReceiver();
            await piplinePS(cgiIO, sr);
            const s = sr.text;
            return JSON.parse(s);
        } catch (e) {
            process.stderr.write(`${e.toString()}\n`);
            return {};
        }
    });
    const jsonParser = JSONStream.parse(".*");
    const stringifier = JSONStream.stringify();
    await piplinePS(process.stdin, jsonParser, cgiRunner, stringifier, process.stdout);
}

run()
.then(() => {
    process.exit(0);
}).catch((e) => {
    console.error(e);
    process.exit(1);
});

/*
const cmd = 'c:\\dev\\run.exe -d "XXX YYY" -s 20200325'
//const cmd = "c:/dev/run.exe -d XXXYYY -s 20200325"
console.log(`cmd=${cmd}`);
const args = parse_cmdline(cmd);
for (const arg of args) {
    console.log(`[${arg}]`);
}
*/