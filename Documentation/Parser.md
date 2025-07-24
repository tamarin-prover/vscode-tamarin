# Using tree-sitter in the Tamarin plugin

First you will need to go to server/grammar/tree-sitter-tamarin folder.
```cd server/grammar/tree-sitter-tamarin```

## Installing dependencies
### On macOS
```brew install tree-sitter docker podman``` 
### On linux
```sudo apt install podman``` 
```npm install``` 

## Podman machine initialisation
These commands are necessary to build the parser.
`podman machine init`
`podman machine start`

## Updating the grammar
This plugin uses [tamarin's grammar](https://github.com/tamarin-prover/tamarin-prover/blob/develop/tree-sitter/tree-sitter-spthy/grammar.js)
This grammar might be outdated compared to the tamarin's newest grammar, missing new functionalities.

In order to update the grammar , you must change the content of grammar.js file in server/grammar/tree-sitter-tamarin folder to the current one (copy paste it).

Then , do the following commands.
```tree-sitter generate``` This command creates all the files needed to use the grammar with Typescript
```tree-sitter build-wasm``` This command creates a dynamic .wasm library which enables you to use the parser inside the vscode plugin (server/grammar/tree-sitter-tamarin/tree-sitter-spthy.wasm).

### Things you must consider when updating the grammar
Updating the grammar may take the symbol table and textmate grammar obsolete, be careful.

## Using the parser
There are many ways to create an instance of the parser using a new grammar. Here we use the following approach.
```typescript
public async initParser(parserPath: string): Promise<void> {
    await Parser.init();
    this.parser = new Parser();
    console.log("Parser path:", parserPath);
    const Tamarin = await Parser.Language.load(parserPath);
    this.parser.setLanguage(Tamarin);
    console.log("Parser initialized with Tamarin language.");
}
```

## Parser usages
The parser is used in :
- [AnalysisManager.ts](server/src/AnalysisManager.ts)
- [analysisManager.test.ts](server/src/features/tests/analysisManager.test.ts)
- [createSymbolTable.test.ts](server/src/features/tests/createSymbolTable.test.ts)

