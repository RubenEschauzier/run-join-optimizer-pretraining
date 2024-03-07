export type optimizerOptions = "adam" | "sgd";
export interface IDataSet {
    trainQueries: string[];
    trainCardinalities: number[];
    valQueries: string[];
    valCardinalities: number[];
}
export interface ISearchTrainLog {
    trainLoss: number[];
    validationError: number[];
}
