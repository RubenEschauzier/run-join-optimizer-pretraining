import * as path from 'path';
import * as fs from 'fs';

class ComunicaOptimizerPretraining{
    public engine: any;
    public queryEngine: any;
    
    public constructor(){
      this.queryEngine = require("@comunica/query-sparql-file").QueryEngine;
    }

    public main(){

    }

    public saveTrainLogToFile(location: string, data: ISearchTrainLog[]){
      fs.writeFileSync(location, JSON.stringify(data));
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
    
    public mean(data: number[]){
      return (data.reduce((a, b) => a + b, 0) / data.length) || 0;
    }
    
    public std(data: number[]) {
      const n = data.length
      const mean = data.reduce((a, b) => a + b) / n
      return Math.sqrt(data.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
    } 

    public scale(data: number[]){
      const min = Math.min(...data);
      const max = Math.max(...data);
      return data.map(x => (x-min)/(max-min));
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
    ): Promise<ISearchTrainLog> {
      return await this.engine.pretrainOptimizer(
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

    public async random_search_hyperparameters(
      n: number,
      epochs: number, 
      lrRange: number[], 
      batchSizeOptions: number[], 
      trainQueries: string[], 
      trainCardinalities: number[], 
      valQueries: string[],
      valCardinalities: number[],
      modelDirectory: string
    ){
      const searchTrainLogs: ISearchTrainLog[] = [];
      for (let i = 0; i<n; i++){
        const lr = this.randomUniformFromRange(lrRange[0], lrRange[1]);
        const batchSize = batchSizeOptions[this.randomIntFromRange(0, batchSizeOptions.length)];
        const rc: number = Math.random();
        let optimizer: optimizerOptions = 'adam';
        if (rc > .5){
          optimizer = 'sgd';
        }
        console.log(`Train run ${i+1}/${n}`);
        console.log(`Parameters: lr: ${lr}, bs: ${batchSize}, opt: ${optimizer}`);
        const trainOutput = await this.runPretraining(trainQueries, trainCardinalities, valQueries, valCardinalities,
          batchSize, epochs, optimizer, lr, modelDirectory)
        trainOutput.lr = lr; trainOutput.bSize = batchSize; trainOutput.opt = optimizer;
        searchTrainLogs.push(trainOutput);
      }
      return searchTrainLogs;
    }

    public randomUniformFromRange(min: number, max: number){
      return Math.random() * (max - min) + min;
    }

    public randomIntFromRange(min: number, max: number){
      return Math.floor(this.randomUniformFromRange(min, max));
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

// TO TEST: 
// ONEHOT ENCODING
// DEEPER NETWORK
// IMPROVE DATA BY REDUCING ISOMORPHISMS
const testModelDirectory = path.join(__dirname, "..", "..", "model-configs", "onehot-encoded-model-config");
console.log(`Model directory: ${testModelDirectory}`);

const runner = new ComunicaOptimizerPretraining();
const queries = runner.readQueries(path.join(__dirname, "..", "..", "data", "query_strings.json"));
const cardinalities: number[] = runner.readCardinalities(path.join(__dirname, "..", "..", "data", "query_cardinalities.json"));
const dataset = runner.createTrainValSplit(queries, cardinalities, .8);
runner.createEngine().then(async () => { 
  console.log(`Number of queries: ${cardinalities.length}, cardinality average: ${runner.mean(runner.scale(cardinalities.map(x => Math.log(x))))} (${runner.std(runner.scale(cardinalities.map(x => Math.log(x))))})`);
  const trainOutput: ISearchTrainLog[] = await runner.random_search_hyperparameters(
    20,
    5,
    [0.00001, 0.001],
    [2, 4, 8, 16, 32, 64, 128, 256],
    dataset.trainQueries,
    dataset.trainCardinalities, 
    dataset.valQueries,
    dataset.valCardinalities,
    testModelDirectory
  )
  runner.saveTrainLogToFile(path.join(__dirname, "..", "..", "train-logs/search-logs.txt"), trainOutput)
});

export type optimizerOptions = "adam" | "sgd";

export interface IDataSet {
  trainQueries: string[];
  trainCardinalities: number[];
  valQueries: string[];
  valCardinalities: number[];
}

export interface ISearchTrainLog {
  lr: number
  bSize: number
  opt: optimizerOptions
  trainLoss: number[]
  validationError: number[]
}