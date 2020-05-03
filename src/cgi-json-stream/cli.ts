#!/usr/bin/env node
import * as JSONStream from "JSONStream";
import {CGIIO, StringReceiver} from "helper-ios";
import {ObjectTransformStream} from "object-transform-stream";
import {pipeline} from "stream";
import {promisify} from "util";
import {parseCommandp} from "parse-command";

const piplinePS = promisify(pipeline);

interface CGIRunParams {
    cmd: string;
    cwd?: string;
    envJSON?: string;
}

const ERROR_NOTHING_TO_RUN = "nothing to run";

async function run() {
    const cgiRunner = new ObjectTransformStream<CGIRunParams, any>(async (input: CGIRunParams) => {
        console.log(`input=${JSON.stringify(input)}`);
        try {
            if (!input && !input.cmd) throw ERROR_NOTHING_TO_RUN;
            const args = await parseCommandp(input.cmd);
            if (args.length === 0) throw ERROR_NOTHING_TO_RUN;
            const command = args[0];
            args.shift();
            const sr = new StringReceiver();
            const cgiIO = new CGIIO(() => {
                const ret: {command: string, args?: string[], cwd?: string, env?: any} = {
                    command
                    ,cwd: input.cwd
                };
                if (args.length > 0) ret.args = args;
                if (input.envJSON) ret.env = JSON.parse(input.envJSON);
                console.log(`ret=${JSON.stringify(ret)}`);
                return ret;
            });
            await piplinePS(cgiIO, sr);
            const s = sr.text;
            return JSON.parse(s);
        } catch (e) {
            console.log(`err=${JSON.stringify(e)}`);
            return {};
        }
    });
    const jsonParser = JSONStream.parse(".*");
    const stringifier = JSONStream.stringify();
    await piplinePS(process.stdin, jsonParser, cgiRunner, stringifier, process.stdout);
 }

 run()
.then((ret) => {
    process.stdout.write(JSON.stringify(ret));
    process.exit(0);
}).catch((e) => {
    console.error(e);
    process.exit(1);
});