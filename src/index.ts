/* We're using Immmutable.js to be able to use complex
 datastructures (such as Sets) as keys in `Map`s. */
import { Map, Set } from 'immutable';
import * as fs from "fs";
import * as path from "path";
import * as cheerio from "cheerio";
import kleur from 'kleur';

type FileLocation = string
type LineNumber = number
type CodeLocation = [FileLocation, LineNumber];
type CssClassSet = Set<string>
type EntriesByClassSet = Map<CssClassSet, CodeLocation[]>

/**
 * Retrieves the line number of the given HTML element within the HTML text.
 * 
 * @param {string} htmlText - The HTML text.
 * @param {cheerio.Element} element - The HTML element.
 * @returns {number} The line number of the HTML element.
 */
const getElementLineNumber = (htmlText: string, element: cheerio.Element): number =>
  htmlText.substring(0, element.startIndex).split("\n").length;

/**
* Merges two EntriesByClassSet maps together.
* 
* @param {EntriesByClassSet} map1 - The first map to merge.
* @param {EntriesByClassSet} map2 - The second map to merge.
* @returns {EntriesByClassSet} The merged map.
*/
const mergeEntries = (map1: EntriesByClassSet, map2: EntriesByClassSet): EntriesByClassSet =>
  map1.mergeWith((entries1, entries2) =>
    (entries1 ?? []).concat(entries2 ?? []), map2);

/**
* Analyzes an HTML file and returns a map of CSS class sets to code locations.
* 
* @param {string} filePath - The path to the HTML file.
* @returns {EntriesByClassSet} A map of CSS class sets to code locations.
*/
const analyzeHtml = (filePath: string): EntriesByClassSet => {
  const htmlText: string = fs.readFileSync(filePath).toString();
  const $ = cheerio.load(htmlText, { withStartIndices: true, xmlMode: true });
  return $('[class]')
    .toArray()
    .filter((element: cheerio.Element) => !($(element).attr('class')?.trim() === ''))
    .reduce((acc: EntriesByClassSet, element: cheerio.Element) => {
      const classSet = Set($(element).attr('class')?.replace(/\s+/g, ' ').trim().split(" "));
      const lineNumber = getElementLineNumber(htmlText, element);
      const newEntry: CodeLocation = [filePath, lineNumber];
      return mergeEntries(acc, (Map() as EntriesByClassSet).set(classSet, [newEntry]));
    }, Map() as EntriesByClassSet);
};

/**
* Analyzes a folder recursively and returns a map of CSS class sets to code locations.
* 
* @param {string} targetPath - The path to the folder to analyze.
* @returns {EntriesByClassSet} A map of CSS class sets to code locations.
*/
const analyzeFolder = (targetPath: string): EntriesByClassSet => {
  const allFiles: string[] = fs.readdirSync(targetPath);
  return allFiles.reduce(
    (accumulator: EntriesByClassSet, file: string) => {
      const filePath: string = path.join(targetPath, file);

      // If the file is a directory and not a hidden directory
      if (fs.statSync(filePath).isDirectory() && !file.startsWith('.')) {
        // Recursively analyze subfolders
        return mergeEntries(accumulator, analyzeFolder(filePath));
      } else if (path.extname(file) === ".html") {
        // Analyze HTML files
        return mergeEntries(accumulator, analyzeHtml(filePath));
      } else {
        // Ignore non-HTML files
        return accumulator;
      }
    },
    Map() as EntriesByClassSet
  ).filter((value, key) => value.length > 1 && key.toArray().length > 1);
};

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

const displayFormattedResult = (result: EntriesByClassSet): void =>
  Array.from(result.entries())
    .sort(([_keyA, valueA], [_keyB, valueB]) => valueB.length - valueA.length)
    .forEach(displayEntry);

const run = () => {
  const targetPath: string = process.argv[2];

  if (!targetPath) {
    console.error('Error: Please provide a target path.');
    process.exit(1);
  }

  const resolvedPath = path.resolve(targetPath);
  if (!fs.existsSync(resolvedPath)) {
    console.error('Error: Path does not exist:', resolvedPath);
    process.exit(1);
  }

  return displayFormattedResult(analyzeFolder(resolvedPath));
};

console.log(run());
