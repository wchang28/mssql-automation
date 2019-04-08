import * as sql from "mssql";
import {connect} from "../connection-factory";
import {Readable, Transform, Writable} from "stream";
const JSONStream = require('JSONStream');
import {ObjectTransformStream} from "object-transform-stream";

const s = process.argv[2];
if (!s) {
    console.error("config json is missing");
    process.exit(1);
}

const config: sql.config = JSON.parse(s);

interface target_config {
    table: string;
    jsonField?: string;
}

interface post_proc_config {
    storedProc: string;
    storedProcIdParam?: string;
}

const s2 = process.argv[3];
if (!s2) {
    console.error("target config is missing");
    process.exit(1);
}

const targetConfig: target_config = JSON.parse(s2);

let postProcConfig: post_proc_config = undefined;
const s3 = process.argv[4];
if (s3) {
    postProcConfig = JSON.parse(s3);
}

function pipe_chain(readabe: Readable, writable: Writable, transformers?: Transform[]) {
    return new Promise<void>((resolve: () => void, reject: (err: any) => void) => {
        readabe.on("error", reject);
        writable.on("error", reject);
        if (transformers && transformers.length > 0) {
            for (const transformer of transformers) {
                readabe = readabe.pipe(transformer);
                readabe.on("error", reject);
            }
        }
        readabe.on("close", resolve);
        readabe.pipe(writable);
    });
}

async function storeRowAsJSON(pool: sql.ConnectionPool, row: any) {
    const targetTable = targetConfig.table;
    const jsonField = (targetConfig.jsonField ? targetConfig.jsonField : "json");
    const query = `INSERT INTO ${targetTable} (${jsonField}) VALUES (@json); SELECT SCOPE_IDENTITY() AS [id]`;
    const result = await pool.request().input("json", JSON.stringify(row)).query(query);
    const id = result.recordset[0]["id"];
    return {id};
}

async function runPostProc(pool: sql.ConnectionPool, id: any) {
    if (!postProcConfig) {
        return {id, result: null};
    } else {
        const idParam = (postProcConfig.storedProcIdParam ? postProcConfig.storedProcIdParam : "id");
        const result = await pool.request().input(idParam, id).execute(postProcConfig.storedProc);
        return {id, result};
    }
}

async function runImpl(pool: sql.ConnectionPool, readabe: Readable, writable: Writable) {
    let jsonParser: Transform = JSONStream.parse(".*");
    let rowArchiver = new ObjectTransformStream(async (row: any) => storeRowAsJSON(pool, row));
    let postProc = new ObjectTransformStream(async (input: {id: string}) => runPostProc(pool, input.id));
    let stringifier: Transform = JSONStream.stringify();

    let transformers: Transform[] = [
        jsonParser
        ,rowArchiver
        ,postProc
        ,stringifier
    ];
    await pipe_chain(readabe, writable, transformers);
}

async function run() {
    let pool = await connect(config);
    try {
        await runImpl(pool, process.stdin, process.stdout);
        pool.close();
    } catch(e) {
        pool.close();
        throw e;
    }
}

run()
.then(() => {
    process.exit(0);
}).catch((err: any) => {
    console.error(`Error: ${JSON.stringify(err)}`);
    process.exit(1);
});