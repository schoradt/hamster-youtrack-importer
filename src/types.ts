import moment from "moment";
import { Issue, Youtrack } from "youtrack-rest-client";

export interface Work {
    issue: string;
    begin: moment.Moment;
    end: moment.Moment;
    minutes: number;
    category: string;
    description: string;
    keywords: string[];
}

export function convertStringToWork(line: string): Work | null {
    const data = line.split('\t');

    if (!data[0]) {
        return null;
    }

    return {
        issue: data[0],
        begin: moment(data[1]),
        end: moment(data[2]),
        minutes: parseInt(data[3], 10),
        category: data[4],
        description: data[5],
        keywords: []
    }
}

export interface IssueWithApi {
    issue: Issue;
    api: Youtrack;
}