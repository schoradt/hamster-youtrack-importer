import {Issue, WorkItem, Youtrack} from "youtrack-rest-client";
import config from "./config";
import { YoutrackTokenOptions } from "youtrack-rest-client/dist/options/youtrack_options";
import { Command } from "commander";
import { readFileSync } from 'fs';
import { importTrack } from "./track";

//add the following line
const program = new Command();

const youtrackConfig : YoutrackTokenOptions = {
    baseUrl: config.youtrack.host, 
    token: config.youtrack.token
};

console.log("Import hamster tsv file to youtrack ...");

program
  .version("1.0.0")
  .description("An example CLI for managing a directory")
  .option("-i, --import  [filename]", "Import TSV file")
  .parse(process.argv);

const options = program.opts();

const youtrack = new Youtrack(youtrackConfig);

if (options['import']) {
    readFileSync(options['import'], 'utf-8')
        .split('\n')
        .slice(1)
        .forEach(
            (line) => {
                const data = line.split('\t');

                if (data[0]) {
                    // find issue
                    importTrack(youtrack, {
                        issue: data[0],
                        begin:data[1],
                        end: data[2],
                        minutes: data[3],
                        category: data[4],
                        description: data[5],
                        keywords: []
                    });
                }
            }
        );
} else {
    console.log(program.help());
}
