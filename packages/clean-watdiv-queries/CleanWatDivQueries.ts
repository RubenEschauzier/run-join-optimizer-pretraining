// import {LoggerTimer} from "@comunica/logger-timer";
// import {QueryEngineFactory} from "@comunica/query-sparql";
// const v8 = require('v8');
// v8.setFlagsFromString('--stack-size=4096');
import * as fs from 'fs';
import * as path from 'path';
import { arrayBuffer } from 'stream/consumers';

  
class CleanWatDivQueries{
    public engine: any;
    public queryEngine: any;
    public rawQueries: string[];
    public cleanedQueries: string[];

    public constructor(){
        this.queryEngine = require("@comunica/query-sparql-file").QueryEngine;
        this.rawQueries=[];
    }
  
    public createEngine(){
        this.engine = new this.queryEngine();
    }
  
    public loadWatDivQueries(queryDir: string){
        const files = fs.readdirSync( queryDir );
        for (const file of files){
            const data = fs.readFileSync( path.join( queryDir, file ), 'utf-8' );
            this.rawQueries.push( data );
        }
        return true
    }

    public formatQueries(){
        let cleanedQueries: string[][] = this.rawQueries.map(x => x.replace(/\n/g, '').replace(/\t/g, '').split('SELECT'));
        cleanedQueries = cleanedQueries.map(x => x.map(y => 'SELECT' + y));
        cleanedQueries.forEach( arr => arr.splice( 0, 1 ) );
        this.cleanedQueries = cleanedQueries.flat();
    }

    public writeCleanedQueries(location: string){
        fs.writeFileSync(location, JSON.stringify(this.cleanedQueries));
    }
}

function write(array: number[], path: string) {
    fs.writeFileSync(path, JSON.stringify(array));
}
const queryEngine = new CleanWatDivQueries();
// Hardcoded to use my personal system wide dataset to prevent mixing matching of dataset instantiations
// If other people want to use this change the path
queryEngine.loadWatDivQueries('/home/reschauz/projects/benchmarks/watdiv-dataset/queries');
queryEngine.formatQueries();
queryEngine.writeCleanedQueries(path.join(__dirname, "..", "..", "data", "cleaned-watdiv-queries", "cleanedQueries.txt"))
