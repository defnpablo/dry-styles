# dry-styles
A tool to understand CSS class usage patterns within projects.

## Functionality Overview

This application parses HTML files within a specified directory, extracting CSS class information from elements. 
It then organizes this data, associating each CSS class with the file location and line number where it's used. This organized data is invaluable for understanding the usage patterns of CSS classes within the project.

This app extracts CSS class info from HTML files in a specified directory, associating each class with its usage location (file and line number). This insight aids in understanding CSS class usage patterns across the project.

## Potential Use with Tailwind CSS
This application's functionality can be particularly beneficial when working with utility-first CSS frameworks like Tailwind CSS. By gaining insights into which utility classes are heavily utilized together and where they're applied, developers can make informed decisions regarding code organization and refactoring.

## Installing Dependencies
```bash
npm install
```

## Running
```bash
npx ts-node src/index.js <target_directory>
```

## Testing
For now the application requires manual testing.
```bash
npx ts-node src/index.ts /Users/pablo/Documents/dry-styles/tests/static
```

## TODO:
[] create cli.ts file to validate input options / give prettier output
[] add an option to include hidden folders on the analisys
[] add an option to exclude certain folders from the analisys
[] add counter to each class set
