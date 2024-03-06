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
class ComunicaOptimizerPretraining {
    constructor() {
        this.queryEngine = require("@comunica/query-sparql-file").QueryEngine;
    }
    main() {
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
        await this.engine.pretrainOptimizer(trainQueries, trainCardinalities, valQueries, valCardinalities, { sources: [path.join(__dirname, "..", "..", "output", "dataset.nt")] }, batchSize, numEpochs, optimizer, lr, modelDirectory);
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
const testModelDirectory = path.join(__dirname, "..", "..", "model-configs", "test-model-config");
const runner = new ComunicaOptimizerPretraining();
const queries = runner.readQueries(path.join(__dirname, "..", "..", "data", "query_strings.json"));
const cardinalities = runner.readCardinalities(path.join(__dirname, "..", "..", "data", "query_cardinalities.json"));
const dataset = runner.createTrainValSplit(queries, cardinalities, .8);
runner.createEngine().then(async () => {
    runner.runPretraining(dataset.trainQueries, dataset.trainCardinalities, dataset.valQueries, dataset.valCardinalities, 32, 100, 'adam', 0.0001, testModelDirectory);
});
console.log("TESTTTTTTT");
//# sourceMappingURL=run-optimizer-pretraining.js.map