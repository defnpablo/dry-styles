import * as fs from "fs";
import * as path from "path";
import kleur from "kleur";
import yargs from "yargs";
import {
  CssClassSet,
  CodeLocation,
  EntriesByClassSet,
  analyzeFolder
} from "./analysis";

const displayEntry = ([classSet, codeLocations]: [CssClassSet, CodeLocation[]]): void => {
  console.log(
    kleur.cyan(classSet.toArray().toString()),
    kleur.white("(" + codeLocations.length + ")")
  );
  codeLocations.forEach(([filePath, lineNumber]) =>
    console.log(
      "    ",
      kleur.green(filePath),
      kleur.yellow(lineNumber)
    )
  )
  console.log("\n");
}

const displayFormattedResult = (result: EntriesByClassSet, sortByEntries: boolean): void =>
  Array.from(result.entries())
    .sort(
      sortByEntries
        ? ([_keyA, valueA], [_keyB, valueB]) => valueB.length - valueA.length
        : ([keyA, _valueA], [keyB, _valueB]) => keyB.toArray().length - keyA.toArray().length)
    .forEach(displayEntry);

const run = (): void => {
  yargs(process.argv.slice(2))
    .command(
      "analyze <path>", 
      "Analyze a folder to detect combinations of CSS classes in use", 
      (yargs) => {
        yargs.positional("path", {
          describe: "The path to the directory",
          type: "string",
        });
    }, (argv) => {
      const resolvedPath = path.resolve(`${argv.path}`);
      if (!fs.existsSync(resolvedPath)) {
        console.error("Error: Path does not exist =>", resolvedPath);
        process.exit(1);
      }
      const result = analyzeFolder(resolvedPath)

      displayFormattedResult(result, argv.sortBy === 'entries');
    })
    .option("sortBy", {
      describe: "Sort by type: classes or entries",
      default: "entries",
      type: "string",
      choices: ["classes", "entries"],
    })
    .strict()
    .demandCommand(1, "You must provide the path argument")
    .help()
    .argv;
}

export { run }