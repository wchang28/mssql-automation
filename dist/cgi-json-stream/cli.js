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
var JSONStream = require("JSONStream");
var helper_ios_1 = require("helper-ios");
var object_transform_stream_1 = require("object-transform-stream");
var stream_1 = require("stream");
var util_1 = require("util");
var parse_command_1 = require("parse-command");
var piplinePS = util_1.promisify(stream_1.pipeline);
var ERROR_NOTHING_TO_RUN = "nothing to run";
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var cgiRunner, jsonParser, stringifier;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cgiRunner = new object_transform_stream_1.ObjectTransformStream(function (input) { return __awaiter(_this, void 0, void 0, function () {
                        var args_1, command_1, sr, cgiIO, s, e_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    if (!input && !input.cmd)
                                        throw ERROR_NOTHING_TO_RUN;
                                    return [4 /*yield*/, parse_command_1.parseCommandp(input.cmd)];
                                case 1:
                                    args_1 = _a.sent();
                                    if (args_1.length === 0)
                                        throw ERROR_NOTHING_TO_RUN;
                                    command_1 = args_1[0];
                                    args_1.shift();
                                    sr = new helper_ios_1.StringReceiver();
                                    cgiIO = new helper_ios_1.CGIIO(function () {
                                        var ret = {
                                            command: command_1,
                                            cwd: input.cwd
                                        };
                                        if (args_1.length > 0)
                                            ret.args = args_1;
                                        if (input.envJSON)
                                            ret.env = JSON.parse(input.envJSON);
                                        return ret;
                                    });
                                    return [4 /*yield*/, piplinePS(cgiIO, sr)];
                                case 2:
                                    _a.sent();
                                    s = sr.text;
                                    return [2 /*return*/, JSON.parse(s)];
                                case 3:
                                    e_1 = _a.sent();
                                    return [2 /*return*/, {}];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    jsonParser = JSONStream.parse(".*");
                    stringifier = JSONStream.stringify();
                    return [4 /*yield*/, piplinePS(process.stdin, jsonParser, cgiRunner, stringifier, process.stdout)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
run()
    .then(function (ret) {
    process.stdout.write(JSON.stringify(ret));
    process.exit(0);
}).catch(function (e) {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map