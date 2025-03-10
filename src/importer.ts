import { Issue, WorkItem, Youtrack } from "youtrack-rest-client";
import config from "./config";
import { readFileSync } from "fs";
import { convertStringToWork, Work } from "./types";
import moment from "moment";

export class Importer {
    private readonly apis: Youtrack[];
   
    constructor() {
        moment.locale("de");

        const hosts = config.youtrack.host.split(";");
        const token = config.youtrack.token.split(";");

        this.apis = [];

        for (let i = 0; i < Math.min(hosts.length, token.length); i++) {
            this.apis.push(new Youtrack({
                baseUrl: hosts[i], 
                token: token[i]
            }))
        }
    }
   
    import(filename: string) {
        readFileSync(filename, 'utf-8')
        .split('\n')
        .slice(1)
        .forEach(
            (line) => {
                // find issue
                this.importWork(convertStringToWork(line));
            }
        );
    }

    private async importWork(work: Work | null) {
        if (work == null) {
            return;
        }
    
        for (const api of this.apis) {
            try {
                const issue = await api.issues.byId(work.issue);

                if (issue) {
                    this.importWorkIntoIssue(api, work, issue);
    
                    return;
                }
            } catch (e) {
                // ignore
            }
        }

        console.error("don't found issue " + work.issue + " in any connected youtrack");
                         
    }

    private importWorkIntoIssue(api: Youtrack, work: Work, issue: Issue) {
        if (!issue.id) {
            return;
        }

        this.workIsAlreadyAssigned(api, work, issue).then((alreadyAssigned: boolean) => {
            if (!issue.id) {
                return;
            }

            if (!alreadyAssigned) {
                api.workItems.create(issue.id, {
                    duration: {
                        minutes: work.minutes
                    },
                    date: work.end.valueOf(),
                    text: this.getItemDescription(work.description, work.category)
                }).then(workItem => {
                    console.log("work " + work.end.format('L') + " '" + this.getItemDescription(work.description, work.category) + "' with " + work.minutes + " minutes was assigned to " + issue.id + " ("+work.issue+")");
                })
                .catch((error) => console.error("can't import work " + work.end.format('L') + " intro issue " + issue.id + " ("+work.issue+")" + ": " + error));
            } else {
                console.log("work " + work.end.format('L') + " '" + this.getItemDescription(work.description, work.category) + "' with " + work.minutes + " minutes was already assigned to " + issue.id + " ("+work.issue+")");
            }
        });
    }

    private workIsAlreadyAssigned(api: Youtrack, work: Work, issue: Issue) : Promise<boolean> {
        return new Promise((resolve) => {
            if (!issue.id) {
                resolve(false);

                return;
            }

            const that = this;

            const searchWorkItem = function (api: Youtrack, work: Work, id: string, skip: number) {
                api.workItems.all(id, { $skip: skip })
                .then((workItems: WorkItem[]) => {
                    if (workItems.length == 0) {
                        resolve(false);
                    }
    
                    for (const workItem of workItems) {
                        if (that.workItemsEqualsWork(workItem, work, )) {
                            resolve(true);
    
                            return;
                        }
    
                    }
    
                    searchWorkItem(api, work, id, skip + workItems.length);
                })
                .catch((error) => {
                    console.error("can't fetch work for issue " + issue.id + ": " + error)

                    resolve(false);
                });
            }

            searchWorkItem(api, work, issue.id, 0);
        });
    }

    private workItemsEqualsWork(workItem: WorkItem, work: Work) {
        return workItem.duration?.minutes == work.minutes 
            && workItem.text == this.getItemDescription(work.description, work.category)
            && moment(workItem.date).isSame(work.end, 'day')
            && workItem.author?.login.includes("schoradt");
    }

    private getItemDescription(description: string, category: string): string {
        if (description && /^\s*$/.test(description)) {
            return description;
        }

        if (category && /^\s*$/.test(category)) {
            return category;
        }

        return "";
    }
}

