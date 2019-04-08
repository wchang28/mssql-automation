import * as sql from "mssql";
export declare function connection(config: sql.config): sql.ConnectionPool;
export declare function connect(config: sql.config): Promise<sql.ConnectionPool>;
