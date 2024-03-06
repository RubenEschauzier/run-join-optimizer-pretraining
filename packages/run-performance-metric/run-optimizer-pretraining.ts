import * as path from 'path';
import * as fs from 'fs';
import { assert } from 'console';

class ComunicaOptimizerPretraining{
    public engine: any;
    public queryEngine: any;
    
    public constructor(){
      this.queryEngine = require("@comunica/query-sparql-file").QueryEngine;
    }

    public main(){

    }

    public async createEngine(){
      this.engine = new this.queryEngine();
    }

    public readQueries(queryFileLocation: string){
      const queries = JSON.parse(fs.readFileSync(queryFileLocation, 'utf8'));
      return queries;
    }

    public readCardinalities(cardinalityFileLocation: string){
      const cardinalities = JSON.parse(fs.readFileSync(cardinalityFileLocation, 'utf8'));
      return cardinalities;
    }

    public createTrainValSplit(queries: string[], cardinalities: number[], trainSize: number){
      if (trainSize > 1 || trainSize < 0){
        throw new Error(`Invalid trainSize, got: ${trainSize}, should be between 0 and 1`);
      }

      this.shuffle(queries, cardinalities);
      const spliceIndex = Math.floor(queries.length * trainSize);
      const dataset: IDataSet = {
        valQueries: queries.splice(spliceIndex),
        valCardinalities: cardinalities.splice(spliceIndex),
        trainQueries: queries,
        trainCardinalities: cardinalities
      };
      return dataset;
    }

    /**
     * Shuffles all input arrays the same way in place
     * @param toShuffle array of elements that need to be shuffled, each element MUST have equal length
     * @returns 
     */
    public shuffle(...toShuffle: any[][]) {
      // Checks if all input lengths are equal
      if (!toShuffle.every((x) => x.length == toShuffle[0].length)){
        console.error("Tried shuffling arrays with unequal length.");
      }

      // Create array with undefined that tracks temporary values for shuffle
      const tempValuesArray: any[] = [];
      for (let k = 0; k< toShuffle.length; k++){
        let x;
        tempValuesArray.push(x);
      }
      // Shuffle the array
      for (let i = toShuffle[0].length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        for (let z = 0; z < tempValuesArray.length; z++){
          tempValuesArray[z] = toShuffle[z][i];
          toShuffle[z][i] = toShuffle[z][j];
          toShuffle[z][j] = tempValuesArray[z];
        }
      }
      return toShuffle;
    }
  

    public async runPretraining(
      trainQueries: string[], 
      trainCardinalities: number[], 
      valQueries: string[],
      valCardinalities: number[],
      batchSize: number, 
      numEpochs: number, 
      optimizer: optimizerOptions,
      lr: number,
      modelDirectory: string
    ){
      await this.engine.pretrainOptimizer(
        trainQueries, 
        trainCardinalities, 
        valQueries,
        valCardinalities,
        {sources: [path.join(__dirname, "..", "..", "output", "dataset.nt")]},
        batchSize, 
        numEpochs,
        optimizer,
        lr,
        modelDirectory    
      );
    }
}

const queryVal = `SELECT ?v0 ?v2 ?v3 WHERE {
	?v0 <http://db.uwaterloo.ca/~galuc/wsdbm/subscribes> <http://db.uwaterloo.ca/~galuc/wsdbm/Website10> .
	?v2 <http://schema.org/caption> ?v3 .
	?v0 <http://db.uwaterloo.ca/~galuc/wsdbm/likes> ?v2 .
} `;

const queryWatDiv = `
SELECT ?v0 ?v2 ?v3 WHERE {
	?v0 <http://db.uwaterloo.ca/~galuc/wsdbm/subscribes> <http://db.uwaterloo.ca/~galuc/wsdbm/Website24> .
	?v2 <http://schema.org/caption> ?v3 .
	?v0 <http://db.uwaterloo.ca/~galuc/wsdbm/likes> ?v2 .
}
`

const testModelDirectory = `/home/reschauz/projects/comunica-join-optimizer-pretraining/packages/
actor-rdf-join-inner-multi-reinforcement-learning-tree/models/gcn-models`;

const runner = new ComunicaOptimizerPretraining();
const queries = runner.readQueries(path.join(__dirname, "..", "..", "data", "query_strings.json"));
const cardinalities = runner.readCardinalities(path.join(__dirname, "..", "..", "data", "query_cardinalities.json"));
const dataset = runner.createTrainValSplit(queries, cardinalities, .8);
runner.createEngine().then(async () => { 
  runner.runPretraining(
    dataset.trainQueries,
    dataset.trainCardinalities, 
    dataset.valQueries,
    dataset.valCardinalities,
    32,
    100,
    'adam',
    0.0001,
    testModelDirectory);
});

export type optimizerOptions = "adam" | "sgd";

export interface IDataSet {
  trainQueries: string[];
  trainCardinalities: number[];
  valQueries: string[];
  valCardinalities: number[];
}