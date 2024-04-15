"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
// import {LoggerTimer} from "@comunica/logger-timer";
// import {QueryEngineFactory} from "@comunica/query-sparql";
// const v8 = require('v8');
// v8.setFlagsFromString('--stack-size=4096');
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class CleanWatDivQueries {
    constructor() {
        this.queryEngine = require("@comunica/query-sparql-file").QueryEngine;
        this.rawQueries = [];
    }
    createEngine() {
        this.engine = new this.queryEngine();
    }
    loadWatDivQueries(queryDir) {
        const files = fs.readdirSync(queryDir);
        for (const file of files) {
            const data = fs.readFileSync(path.join(queryDir, file), 'utf-8');
            this.rawQueries.push(data);
        }
        return true;
    }
    formatQueries() {
        let cleanedQueries = this.rawQueries.map(x => x.replace(/\n/g, '').replace(/\t/g, '').split('SELECT'));
        cleanedQueries = cleanedQueries.map(x => x.map(y => 'SELECT' + y));
        cleanedQueries.forEach(arr => arr.splice(0, 1));
        this.cleanedQueries = cleanedQueries.flat();
    }
    writeCleanedQueries(location) {
        fs.writeFileSync(location, JSON.stringify(this.cleanedQueries));
    }
}
function write(array, path) {
    fs.writeFileSync(path, JSON.stringify(array));
}
const queryEngine = new CleanWatDivQueries();
// Hardcoded to use my personal system wide dataset to prevent mixing matching of dataset instantiations
// If other people want to use this change the path
queryEngine.loadWatDivQueries('/home/reschauz/projects/benchmarks/watdiv-dataset/queries');
queryEngine.formatQueries();
queryEngine.writeCleanedQueries(path.join(__dirname, "..", "..", "data", "cleaned-watdiv-queries", "cleanedQueries.txt"));
//# sourceMappingURL=CleanWatDivQueries.js.map