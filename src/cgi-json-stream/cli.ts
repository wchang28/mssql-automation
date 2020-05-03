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

function parse_cmdline(cmdline) {
    var re_next_arg = /^\s*((?:(?:"(?:\\.|[^"])*")|(?:'[^']*')|\\.|\S)+)\s*(.*)$/;
    var next_arg = ['', '', cmdline];
    var args = [];
    while (next_arg = re_next_arg.exec(next_arg[2])) {
        var quoted_arg = next_arg[1];
        var unquoted_arg = "";
        while (quoted_arg.length > 0) {
            if (/^"/.test(quoted_arg)) {
                var quoted_part = /^"((?:\\.|[^"])*)"(.*)$/.exec(quoted_arg);
                unquoted_arg += quoted_part[1].replace(/\\(.)/g, "$1");
                quoted_arg = quoted_part[2];
            } else if (/^'/.test(quoted_arg)) {
                var quoted_part = /^'([^']*)'(.*)$/.exec(quoted_arg);
                unquoted_arg += quoted_part[1];
                quoted_arg = quoted_part[2];
            } else if (/^\\/.test(quoted_arg)) {
                unquoted_arg += quoted_arg[1];
                quoted_arg = quoted_arg.substring(2);
            } else {
                unquoted_arg += quoted_arg[0];
                quoted_arg = quoted_arg.substring(1);
            }
        }
        args[args.length] = unquoted_arg;
    }
    return args;
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