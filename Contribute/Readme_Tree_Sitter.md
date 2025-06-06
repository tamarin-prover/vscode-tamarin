# Using tree-sitter in the Tamarin plugin

### Installing dependencies

To install the required dependencies, one can use brew:

```brew install tree-sitter docker podman```

Then you need to initialize and start podman as follows:

`podman machine init` and `podman machine start`

### Importing the grammar
All the files required to use the grammar in the plugin are located in src/grammar/tree-sitter-tamarin.

To use tree-sitter with a new grammar, use the ```tree-sitter generate``` command.
\
 ⚠️ this command creates all the files needed to use the grammar with Typescript, for example grammar.js, as well as json and C files. In particular, the parser is created.

### Importing the parser
Then, to use the parser inside the vscode plugin, use:

TODO : Remplacer ici avec la version correcte de l'ajout du parser dans le plugin vscode (voir notes du 6 Juin)
\
```tree-sitter build --wasm --output src/grammar/parser-tamarin.wasm```
\
To perform this command you need to have docker running or install the other applications suggested on tree sitter website:
\
 https://tree-sitter.github.io/tree-sitter/creating-parsers#command-build
\
This command creates a dynamic .wasm library which enables you to use the parser inside the vscode plugin.

### Using the parser
There are many ways to create an instance of the parser using a new grammar. Here we use the following approach:
\
```Typescript 
import Parser =require( "web-tree-sitter");
```
\
And then inside a function :

```Typescript
await Parser.init();
const parser = new Parser();
const Tamarin =   await Parser.Language.load('/absolute_path_to_wasm_file');
parser.setLanguage(Tamarin);
```


