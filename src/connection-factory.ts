import * as sql from "mssql";

export function connection(config: sql.config) {
    if (config.options && typeof config.options.trustedConnection === "boolean" && config.options.trustedConnection) {
        const nsql = require('mssql/msnodesqlv8');
        return (new nsql.ConnectionPool(config)) as sql.ConnectionPool;
    } else {
        return new sql.ConnectionPool(config);
    }
}

export async function connect(config: sql.config) {
    return await connection(config).connect();
}