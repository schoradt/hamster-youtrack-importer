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
            const issue = await api.issues.byId(work.issue);

            if (issue) {
                this.importWorkIntoIssue(api, work, issue);

                return;
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
                    text: work.description
                }).then(workItem => {
                    console.log("work '" + work.description + "' with " + work.minutes + " minutes was assigned to " + issue.id);
                })
                .catch((error) => console.error("can't import work intro issue " + issue.id + ": " + error));
            } else {
                console.log("work " + work.end.format('L') + " '" + work.description + "' with " + work.minutes + " minutes was already assigned to " + issue.id);
            }
        });
    }

    private workIsAlreadyAssigned(api: Youtrack, work: Work, issue: Issue) : Promise<boolean> {
        return new Promise((resolve) => {
            if (!issue.id) {
                resolve(false);

                return;
            }

            api.workItems.all(issue.id)
                .then((workItems: WorkItem[]) => {
                    for (const workItem of workItems) {
                        if (this.workItemsEqualsWork(workItem, work)) {
                            resolve(true);

                            return;
                        }

                    }

                    resolve(false);
                })
                .catch((error) => {
                    console.error("can't fetch work for issue " + issue.id + ": " + error)

                    resolve(false);
                });
        });
    }

    private workItemsEqualsWork(workItem: WorkItem, work: Work) {
        return workItem.duration?.minutes == work.minutes 
            && workItem.text == work.description
            && moment(workItem.date).isSame(work.end, 'day');
    }
}

