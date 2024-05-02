// We're using Immmutable.js to be able to use complex
// datastructures (such as Sets) as keys in `Map`s.
import { Map, Set } from 'immutable';
import * as fs from "fs";
import * as path from "path";
import * as cheerio from "cheerio";

type FileLocation = string
type LineNumber = number
type CodeLocation = [FileLocation, LineNumber];
type CssClassSet = Set<string>
type EntriesByClassSet = Map<CssClassSet, CodeLocation[]>

const getElementLineNumber = (htmlText: string, element: cheerio.Element): number =>
    htmlText.substring(0, element.startIndex).split("\n").length

const mergeEntries = (map1: EntriesByClassSet, map2: EntriesByClassSet): EntriesByClassSet =>
    map1.mergeWith((entries1, entries2) =>
      (entries1 ?? []).concat(entries2 ?? []), map2);


const analyzeHtml = (filePath: string): EntriesByClassSet => {
    const htmlText: string = fs.readFileSync(filePath).toString();
    const $ = cheerio.load(htmlText, {withStartIndices: true, xmlMode: true})
    return $('[class]')
      .toArray()
      .filter((element: cheerio.Element) => !($(element).attr('class')?.trim() === ''))
      .reduce((acc: EntriesByClassSet, element: cheerio.Element) => {
        const classSet = Set($(element).attr('class')?.replace(/\s+/g, ' ').trim().split(" "))
        const lineNumber = getElementLineNumber(htmlText, element);
        const newEntry: CodeLocation = [filePath, lineNumber];
        return mergeEntries(acc, (Map() as EntriesByClassSet).set(classSet, [newEntry]))
      }, Map() as EntriesByClassSet)
  }

const analyzeFolder = (targetPath: FileLocation): EntriesByClassSet => {
  const allFiles: string[] = fs.readdirSync(targetPath);
  return allFiles.reduce(
    (accumulator: EntriesByClassSet, file: string) => {
      const filePath: string = path.join(targetPath, file);
      if (fs.statSync(filePath).isDirectory()) {
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
  ).filter((value, _key) => value.length > 1);
}

const run = () => {
  const targetPath: FileLocation = process.argv[2];

  if (!targetPath) {
    console.error('Error: Please provide a target path.');
    process.exit(1);
  }

  const resolvedPath = path.resolve(targetPath);
  if (! fs.existsSync(resolvedPath)) {
    console.error('Error: Path does not exist:', targetPath);
    process.exit(1);
  }
  
  return analyzeFolder(resolvedPath).toJS();
}

console.log(run())
