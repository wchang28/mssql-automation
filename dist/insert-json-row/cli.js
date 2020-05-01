#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var connection_factory_1 = require("../connection-factory");
var JSONStream = require("JSONStream");
var object_transform_stream_1 = require("object-transform-stream");
var s = process.argv[2];
if (!s) {
    console.error("config json is missing");
    process.exit(1);
}
var config = JSON.parse(s);
var s2 = process.argv[3];
if (!s2) {
    console.error("target config is missing");
    process.exit(1);
}
var targetConfig = JSON.parse(s2);
var postProcConfig = undefined;
var s3 = process.argv[4];
if (s3) {
    postProcConfig = JSON.parse(s3);
}
function pipe_chain(readabe, writable, transformers) {
    return new Promise(function (resolve, reject) {
        readabe.on("error", reject);
        writable.on("error", reject);
        if (transformers && transformers.length > 0) {
            for (var _i = 0, transformers_1 = transformers; _i < transformers_1.length; _i++) {
                var transformer = transformers_1[_i];
                readabe = readabe.pipe(transformer);
                readabe.on("error", reject);
            }
        }
        readabe.on("close", resolve);
        readabe.pipe(writable);
    });
}
function storeRowAsJSON(pool, row) {
    return __awaiter(this, void 0, void 0, function () {
        var targetTable, jsonField, query, result, id;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    targetTable = targetConfig.table;
                    jsonField = (targetConfig.jsonField ? targetConfig.jsonField : "json");
                    query = "INSERT INTO " + targetTable + " (" + jsonField + ") VALUES (@json); SELECT SCOPE_IDENTITY() AS [id]";
                    return [4 /*yield*/, pool.request().input("json", JSON.stringify(row)).query(query)];
                case 1:
                    result = _a.sent();
                    id = result.recordset[0]["id"];
                    return [2 /*return*/, { id: id }];
            }
        });
    });
}
function runPostProc(pool, id) {
    return __awaiter(this, void 0, void 0, function () {
        var idParam, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!postProcConfig) return [3 /*break*/, 1];
                    return [2 /*return*/, { id: id, result: null }];
                case 1:
                    idParam = (postProcConfig.storedProcIdParam ? postProcConfig.storedProcIdParam : "id");
                    return [4 /*yield*/, pool.request().input(idParam, id).execute(postProcConfig.storedProc)];
                case 2:
                    result = _a.sent();
                    return [2 /*return*/, { id: id, result: result }];
            }
        });
    });
}
function runImpl(pool, readabe, writable) {
    return __awaiter(this, void 0, void 0, function () {
        var jsonParser, rowArchiver, postProc, stringifier, transformers;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jsonParser = JSONStream.parse(".*");
                    rowArchiver = new object_transform_stream_1.ObjectTransformStream(function (row) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                        return [2 /*return*/, storeRowAsJSON(pool, row)];
                    }); }); });
                    postProc = new object_transform_stream_1.ObjectTransformStream(function (input) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                        return [2 /*return*/, runPostProc(pool, input.id)];
                    }); }); });
                    stringifier = JSONStream.stringify();
                    transformers = [
                        jsonParser,
                        rowArchiver,
                        postProc,
                        stringifier
                    ];
                    return [4 /*yield*/, pipe_chain(readabe, writable, transformers)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var pool, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection_factory_1.connect(config)];
                case 1:
                    pool = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, runImpl(pool, process.stdin, process.stdout)];
                case 3:
                    _a.sent();
                    pool.close();
                    return [3 /*break*/, 5];
                case 4:
                    e_1 = _a.sent();
                    pool.close();
                    throw e_1;
                case 5: return [2 /*return*/];
            }
        });
    });
}
run()
    .then(function () {
    process.exit(0);
}).catch(function (err) {
    console.error("Error: " + JSON.stringify(err));
    process.exit(1);
});
//# sourceMappingURL=cli.js.map