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
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const tf = __importStar(require("@tensorflow/tfjs-node"));
class ComunicaOptimizerPretraining {
    constructor() {
        this.queryEngine = require("@comunica/query-sparql-file").QueryEngine;
    }
    main() {
    }
    saveTrainLogToFile(location, data) {
        fs.writeFileSync(location, JSON.stringify(data));
    }
    async createEngine() {
        this.engine = new this.queryEngine();
    }
    readQueries(queryFileLocation) {
        const queries = JSON.parse(fs.readFileSync(queryFileLocation, 'utf8'));
        return queries;
    }
    readCardinalities(cardinalityFileLocation) {
        const cardinalities = JSON.parse(fs.readFileSync(cardinalityFileLocation, 'utf8'));
        return cardinalities;
    }
    mean(data) {
        return (data.reduce((a, b) => a + b, 0) / data.length) || 0;
    }
    std(data) {
        const n = data.length;
        const mean = data.reduce((a, b) => a + b) / n;
        return Math.sqrt(data.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
    }
    scale(data) {
        const min = Math.min(...data);
        const max = Math.max(...data);
        return data.map(x => (x - min) / (max - min));
    }
    createTrainValSplit(queries, cardinalities, trainSize) {
        if (trainSize > 1 || trainSize < 0) {
            throw new Error(`Invalid trainSize, got: ${trainSize}, should be between 0 and 1`);
        }
        this.shuffle(queries, cardinalities);
        const spliceIndex = Math.floor(queries.length * trainSize);
        const dataset = {
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
    shuffle(...toShuffle) {
        // Checks if all input lengths are equal
        if (!toShuffle.every((x) => x.length == toShuffle[0].length)) {
            console.error("Tried shuffling arrays with unequal length.");
        }
        // Create array with undefined that tracks temporary values for shuffle
        const tempValuesArray = [];
        for (let k = 0; k < toShuffle.length; k++) {
            let x;
            tempValuesArray.push(x);
        }
        // Shuffle the array
        for (let i = toShuffle[0].length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            for (let z = 0; z < tempValuesArray.length; z++) {
                tempValuesArray[z] = toShuffle[z][i];
                toShuffle[z][i] = toShuffle[z][j];
                toShuffle[z][j] = tempValuesArray[z];
            }
        }
        return toShuffle;
    }
    async runPretraining(trainQueries, trainCardinalities, valQueries, valCardinalities, batchSize, numEpochs, optimizer, lr, modelDirectory) {
        return await this.engine.pretrainOptimizer(trainQueries, trainCardinalities, valQueries, valCardinalities, { sources: [path.join(__dirname, "..", "..", "output", "dataset.nt")] }, batchSize, numEpochs, optimizer, lr, modelDirectory);
    }
    async random_search_hyperparameters(n, epochs, lrRange, batchSizeOptions, trainQueries, trainCardinalities, valQueries, valCardinalities, modelDirectory) {
        const searchTrainLogs = [];
        for (let i = 0; i < n; i++) {
            console.log(tf.memory().numTensors);
            const lr = this.randomUniformFromRange(lrRange[0], lrRange[1]);
            const batchSize = batchSizeOptions[this.randomIntFromRange(0, batchSizeOptions.length)];
            const rc = Math.random();
            let optimizer = 'adam';
            if (rc > .5) {
                optimizer = 'sgd';
            }
            console.log(`Train run ${i + 1}/${n}`);
            console.log(`Parameters: lr: ${lr}, bs: ${batchSize}, opt: ${optimizer}`);
            const trainOutput = await this.runPretraining(trainQueries, trainCardinalities, valQueries, valCardinalities, batchSize, epochs, optimizer, lr, modelDirectory);
            trainOutput.lr = lr;
            trainOutput.bSize = batchSize;
            trainOutput.opt = optimizer;
            searchTrainLogs.push(trainOutput);
        }
        return searchTrainLogs;
    }
    randomUniformFromRange(min, max) {
        return Math.random() * (max - min) + min;
    }
    randomIntFromRange(min, max) {
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
`;
// TO TEST: 
// ONEHOT ENCODING
// DEEPER NETWORK
// IMPROVE DATA BY REDUCING ISOMORPHISMS
const testModelDirectory = path.join(__dirname, "..", "..", "model-configs", "onehot-encoded-model-config");
console.log(`Model directory: ${testModelDirectory}`);
const runner = new ComunicaOptimizerPretraining();
const queries = runner.readQueries(path.join(__dirname, "..", "..", "data", "query_strings.json"));
const cardinalities = runner.readCardinalities(path.join(__dirname, "..", "..", "data", "query_cardinalities.json"));
const dataset = runner.createTrainValSplit(queries, cardinalities, .8);
runner.createEngine().then(async () => {
    console.log(`Number of queries: ${cardinalities.length}, cardinality average: ${runner.mean(runner.scale(cardinalities.map(x => Math.log(x))))} (${runner.std(runner.scale(cardinalities.map(x => Math.log(x))))})`);
    const trainOutput = await runner.random_search_hyperparameters(20, 5, [0.00001, 0.001], [2, 4, 8, 16, 32, 64, 128, 256], dataset.trainQueries.slice(0, 10), dataset.trainCardinalities.slice(0, 10), dataset.valQueries.slice(0, 10), dataset.valCardinalities.slice(0, 10), testModelDirectory);
    runner.saveTrainLogToFile(path.join(__dirname, "..", "..", "train-logs/search-logs.txt"), trainOutput);
});
//# sourceMappingURL=run-optimizer-pretraining.js.map