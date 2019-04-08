import * as sql from "mssql";
import {connect} from "../connection-factory";

const s = process.argv[2];
if (!s) {
    console.error("config json is missing");
    process.exit(1);
}

const config: sql.config = JSON.parse(s);

//console.log(JSON.stringify(config, null, 2));

const query = process.argv[3];
if (!query) {
    console.error("sql query is missing");
    process.exit(1);
}

async function run() {
    let pool = await connect(config);
    try {
        let result = await pool.request().query(query);
        pool.close();
        return result.recordsets;
    } catch(e) {
        pool.close();
        throw e;
    }
}

run()
.then((recordsets) => {
    process.stdout.write(JSON.stringify(recordsets));
    process.exit(0);
}).catch((err: any) => {
    console.error(`Error: ${JSON.stringify(err)}`);
    process.exit(1);
});
