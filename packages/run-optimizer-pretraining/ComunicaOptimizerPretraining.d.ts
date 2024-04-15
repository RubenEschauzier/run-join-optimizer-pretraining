export type optimizerOptions = "adam" | "sgd";
export interface IDataSet {
    trainQueries: string[];
    trainCardinalities: number[];
    valQueries: string[];
    valCardinalities: number[];
}
export interface ISearchTrainLog {
    lr: number;
    bSize: number;
    opt: optimizerOptions;
    trainLoss: number[];
    validationError: number[];
}
