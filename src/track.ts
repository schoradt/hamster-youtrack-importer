import { Issue, WorkItem, Youtrack } from "youtrack-rest-client";
import moment from 'moment';

export interface Track {
    issue: string;
    begin: string;
    end: string;
    minutes: string;
    category: string;
    description: string;
    keywords: string[];
}

export function importTrack(youtrack: Youtrack, track: Track) {
    youtrack.issues.byId(track.issue)
        .then((issue: Issue) => {
            console.log("found issue " + issue.id);

            if (issue.project) {
                // youtrack.workItems.all(issue.id!!).then((workItems: WorkItem[]) => {
                //     console.log(JSON.stringify(workItems));
                // }).catch((error) => console.error("don't found worklog for " + issue.id));
                youtrack.workItems.create(issue.id!!, {
                    duration: {
                        minutes: parseInt(track.minutes, 10)
                    },
                    date: moment(track.begin).valueOf(),
                    text: track.description
                }).then(workItem => {
                    console.log({workItem});
                })
                //.catch((error) => console.error("cant create worklog " + error));
            }
            
        })
        .catch((error) => console.error("don't found issue " + track.issue));
                     
}