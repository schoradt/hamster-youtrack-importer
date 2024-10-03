import { Command } from "commander";
import { Importer } from "./importer";


//add the following line
const program = new Command();



console.log("Import hamster tsv file to youtrack ...");

program
  .version("1.0.0")
  .description("An example CLI for managing a directory")
  .option("-i, --import  [filename]", "Import TSV file")
  .parse(process.argv);

const options = program.opts();

const importer = new Importer()

if (options['import']) {
    importer.import(options['import']);
} else {
    console.log(program.help());
}
