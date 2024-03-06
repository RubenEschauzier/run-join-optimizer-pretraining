export type optimizerOptions = "adam" | "sgd";
export interface IDataSet {
    trainQueries: string[];
    trainCardinalities: number[];
    valQueries: string[];
    valCardinalities: number[];
}
