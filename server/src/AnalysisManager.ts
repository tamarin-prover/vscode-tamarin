import { TextDocument } from "vscode-languageserver-textdocument";
import { detect_errors } from "./features/syntax_errors";   
import { Diagnostic ,Position, Location,WorkspaceEdit,TextEdit} from "vscode-languageserver-types";
import * as Parser from "web-tree-sitter";
import {TamarinSymbolTable,createSymbolTable} from "./symbol_table/create_symbol_table";
import { checks_with_table } from "./features/checks/index";
import { DeclarationType} from "./symbol_table/tamarinTypes";
import * as fs from 'fs';
import * as path from 'path';
import { URI } from 'vscode-uri'; 

export class AnalysisManager{
    private spthyParser: Parser|undefined;
    private splibParser: Parser|undefined;
    private documentSymbolTables: Map<string, TamarinSymbolTable>;

    constructor() {
        this.documentSymbolTables = new Map<string, TamarinSymbolTable>();
    }

    public async initParsers(SpthyParserPath: string, SplibParserPath: string): Promise<void> {
        await Parser.init();

        this.spthyParser = new Parser();
        const spthyLang = await Parser.Language.load(SpthyParserPath);
        this.spthyParser.setLanguage(spthyLang);
        console.log("SPTHY Parser initialized with Tamarin language.");
    
        this.splibParser = new Parser();
        const splibLang = await Parser.Language.load(SplibParserPath);
        this.splibParser.setLanguage(splibLang);
        console.log("SPLIB Parser initialized with Tamarin language.");

    }


    //error and warning display
    public async AnalyseDocument(document: TextDocument): Promise<Diagnostic[]> {
        if (!this.spthyParser || !this.splibParser) {
            throw new Error("Parser not initialized");
        }
        const newSymbolTables = new Map<string, TamarinSymbolTable>();
        const visitedUrisInThisPass = new Set<string>();
        await this.AnalyseImports(document.uri, document.getText(), newSymbolTables, visitedUrisInThisPass);
        this.documentSymbolTables = newSymbolTables;
        console.log(`[AnalysisManager] Cache updated. Total files analyzed: ${this.documentSymbolTables.size}`);

        const parserToUse: Parser = document.uri.endsWith('.splib')
            ? this.splibParser
            : this.spthyParser;

        if (!parserToUse) {
            throw new Error(`No parser available for URI: ${document.uri}`);
        }

        const tree = parserToUse.parse(document.getText());

        const {diagnostics: syntaxDiagnostics } = await detect_errors(tree.rootNode,document);
        const { symbolTable, diags: symbolTableChecks } = await createSymbolTable(tree.rootNode, document);
        this.documentSymbolTables.set(document.uri, symbolTable);
        // checks with table

        const wellformednessDiagnostics = await checks_with_table(symbolTable, document, tree.rootNode,this.documentSymbolTables);
        console.log("Symbol table created for:", document.uri);
        console.log("Number of symbols found:", symbolTable.getSymbols().length);
        console.log("Wellformedness diagnostics:", wellformednessDiagnostics.length);
        console.log("Symbol table", symbolTable);
        const allDiagnostics = [
            ...syntaxDiagnostics,
            ...wellformednessDiagnostics,
            ...symbolTableChecks
        ];
        return allDiagnostics;
    }

    public clearCache(): void {
        this.documentSymbolTables.clear();
    }
    
    private async AnalyseImports(uri: string, 
        content: string | undefined, 
        tablesForThisPass: Map<string, TamarinSymbolTable>, 
        visitedInThisPass: Set<string>,
        ): Promise<void> {
        if (!this.spthyParser || !this.splibParser) return;
        if (visitedInThisPass.has(uri)) {
            return;
        }
        visitedInThisPass.add(uri);
        let fileContent = content;
        if (fileContent === undefined) {
            try {
                const fsPath = URI.parse(uri).fsPath;
                fileContent = fs.readFileSync(fsPath, 'utf8');
            } catch (error) {
                console.error(`[AnalysisManager] Failed to read imported file ${uri}: ${error}`);
                return;
            }
        }

        const doc = TextDocument.create(uri, 'tamarin', 1, fileContent);
        const tree = this.splibParser.parse(doc.getText());
        const { symbolTable} = await createSymbolTable(tree.rootNode, doc);
        tablesForThisPass.set(uri, symbolTable);
        const includePaths = symbolTable.getIncludes() || [];
        const currentDir = path.dirname(URI.parse(uri).fsPath);
        for (const relativePath of includePaths) {
            const absolutePath = path.resolve(currentDir, relativePath);
            const importedUri = URI.file(absolutePath).toString();
            await this.AnalyseImports(importedUri, undefined, tablesForThisPass, visitedInThisPass);
        }
    }
    //goto
    public getDefinition(document: TextDocument, position: Position): Location | null {
        if(!this.spthyParser) {
            throw new Error("Parser not initialized");
        }
        const table = this.documentSymbolTables.get(document.uri);
        if (!table) {
            console.error(`No symbol table found for document: ${document.uri}`);
            return null;
        }
        const tree= this.spthyParser.parse(document.getText());
        const point = {row: position.line, column: position.character};
        const nodeAtcursor = tree.rootNode.descendantForPosition(point);
        if (!nodeAtcursor) {
            console.error(`No node found at position: ${point.row}, ${point.column}`);
            return null;
        }
        const symbolName = nodeAtcursor.text;
        const symbol = table.getSymbols().find(sym => sym.name === symbolName);
        if (symbol && symbol.name_range) {
            const location: Location = {
                uri: document.uri,
                range: symbol.name_range

            };
            return location
        }
        return null;

    }

    public handleDocumentClose(uri: string): void {
        console.log(`Document closed: ${uri}. Cleaning up symbol table.`);
        this.documentSymbolTables.delete(uri);
    }
    //rename
    public handleRenameRequest(document: TextDocument, position: Position, newName: string): WorkspaceEdit | null {
        const table = this.documentSymbolTables.get(document.uri);
        if (!table) return null
        if (!this.spthyParser) {
            throw new Error("Parser not initialized");
        }
        const tree = this.spthyParser.parse(document.getText());
        const point = {row: position.line, column: position.character};
        const nodeAtCursor = tree.rootNode.descendantForPosition(point);
        if (!nodeAtCursor) {
            return null;
        }
        const oldname= tree.rootNode.namedDescendantForPosition(point).text;
        const originalSymbol = table.getSymbols().find(symbol => 
            symbol.name === oldname && 
            symbol.name_range && 
            symbol.name_range.start.line === position.line && 
            symbol.name_range.start.character === position.character
        );
        if (!originalSymbol) return null;
        const edits: TextEdit[] = [];
        const chosenSymbolName = originalSymbol.name;
        for (const symbol of table.getSymbols()) {
            let shouldRename=false;
            if (symbol.declaration === DeclarationType.PRVariable ||
                symbol.declaration === DeclarationType.ActionFVariable ||
                symbol.declaration === DeclarationType.CCLVariable
            ){
                if (originalSymbol.context === symbol.context && chosenSymbolName === symbol.name) {
                    shouldRename = true;
                }
            }
            else if( symbol.declaration === DeclarationType.LemmaVariable){
                if (symbol.associated_qf?.id === originalSymbol.associated_qf?.id && symbol.name === chosenSymbolName) {
                    shouldRename = true;
                }
            }
            else if (symbol.declaration === DeclarationType.LEquationVariable || 
                     symbol.declaration === DeclarationType.REquationVariable ||
                     symbol.declaration === DeclarationType.LMacroVariable ||
                     symbol.declaration === DeclarationType.RMacroVariable) {
                if (originalSymbol.context.id === symbol.context.id && chosenSymbolName === symbol.name) {
                    shouldRename = true;
                }
            }
            else if (symbol.name === chosenSymbolName && symbol.declaration === originalSymbol.declaration) { 
                shouldRename = true;
            }
            if (shouldRename) {
                if (symbol.name_range) {
                    edits.push(TextEdit.replace(symbol.name_range, newName));
                }
            }
        }
        if (edits.length === 0){
            return null;
        }
        const workspaceEdit: WorkspaceEdit = {
            changes: {
                [document.uri]: edits
            }
        };
        return workspaceEdit;
    }
    
}
