import path = require('path');
import * as vscode from 'vscode'
import Parser =require( "web-tree-sitter");
import { CreateSymbolTableResult, createSymbolTable } from '../symbol_table/create_symbol_table';
import { Range } from 'vscode';


let diagnostics = vscode.languages.createDiagnosticCollection('Tamarin');
export let symbolTables = new Map<string, CreateSymbolTableResult>();


//given an node returns his index in his father's children list 
function get_child_index(node : Parser.SyntaxNode): number|null{
    if(node.parent === null ){
        return null;
    }
    const children = node.parent.children;
    for (let i = 0; i < children.length; i++) {
      if (children[i].id === node.id) {
        return i >= 0 ? i : null;
      }
    }
    return 0;

}

// Get the text corresponding to a node range 
export function getName(node : Parser.SyntaxNode| null, editor: vscode.TextEditor): string {
    if(node && node.isNamed ){
        return(editor.document.getText(new Range(editor.document.positionAt(node.startIndex),editor.document.positionAt(node.endIndex))));
        
    }
    else{
        return "None"
    }
}





/* Function used to detect syntax errors sent by the parser with MISSING or ERROR nodes,
I tried to personnalize error messages according to the different cases
I did the most common ones*/
export async function detect_errors(editeur: vscode.TextEditor): Promise<Parser.SyntaxNode|void> {
    let editor = editeur;
    
    if (!editor) {
        return;
    }

    // fail-save to prevent analysis of non-tamarin files
    const languageId = editor.document.languageId
    if (!(languageId === 'tamarin')){
        return;
    }

    await Parser.init();
    const parser = new Parser();
    const parserPath = path.join(__dirname + '../../../', 'src', 'grammar', 'parser-tamarin.wasm'); //Charge la grammaire tree-sitter pour parser
    const Tamarin =  await Parser.Language.load(parserPath);
    parser.setLanguage(Tamarin);
    
    let diags: vscode.Diagnostic[] = [];
    let text = editor.document.getText();
    const tree =  parser.parse(text);
    
    function build_error_display(node : Parser.SyntaxNode, editeur: vscode.TextEditor, message : string){
        let start = node.startIndex;
        let positionStart = editeur.document.positionAt(start);
        let existingDiag = diags.find(d => d.range.contains(positionStart)); // Evite les superpositions de diagnostics
        if (!existingDiag) {
        diags.push(new vscode.Diagnostic(new vscode.Range(positionStart, positionStart.translate(0,0) ), message, vscode.DiagnosticSeverity.Error));
        }
    }

    // This is where i tried to detect particular cases for syntax errors based on nodes position 
    function typesOfError(node : Parser.SyntaxNode, editeur: vscode.TextEditor){
        if(node.grammarType === 'theory' || node.nextSibling?.nextSibling?.grammarType === 'begin' || node.nextSibling?.grammarType === 'begin'){
            build_error_display(node, editeur, "MISSING 'theory' or 'begin'")

        }
        else if(node.firstChild?.grammarType === "builtins" || node.firstChild?.grammarType === "functions" || node.firstChild?.grammarType === "macros" ){
            build_error_display(node, editeur, "MISSING ':' ");
        }
        else if ( node.nextSibling?.grammarType === 'built_in'){
            build_error_display(node, editeur, "MISSING ',' ");   
        }
        else if(node.firstChild?.grammarType === "rule" && (node.firstChild.nextSibling?.grammarType != "ident" || node.firstChild.nextSibling?.nextSibling?.grammarType != ":") ){
            build_error_display(node, editeur, "MISSING ':' or rule name ");
        }
        else if(node.firstChild?.grammarType === "lemma"){
            build_error_display(node, editeur, "MISSING ':' or lemma name ");
        }
        else if (node.firstChild?.grammarType === "premise" || (node.firstChild?.grammarType === "rule" && (node.firstChild.nextSibling?.grammarType === "ident" || node.firstChild.nextSibling?.nextSibling?.grammarType === ":"))){
            build_error_display(node, editeur, "ERROR in rule structure the syntax for a rule is either \n []-->[] \n or \n []--[]->[]")
        }
        else if(node.firstChild?.grammarType === "pre_defined"){
            build_error_display(node, editeur, "MISSING generalized quantifier");
        }
        else if (node.firstChild?.grammarType === "nested_formula" || node.firstChild?.grammarType === "action_constraint" || node.firstChild?.grammarType === "conjunction"){
            build_error_display(node, editeur, "EXPECTING '&', '∧', '|', '∨', '==>'");
        }
        else {
            build_error_display(node, editeur, node.toString().slice(1,-1));
        }
    }
 
    // PLace where missing and error nodes are detected, then builds the error
    function findMatches(node : Parser.SyntaxNode, editeur: vscode.TextEditor ) {
        if ((node.isMissing)) {
            let myId = get_child_index(node);
            if(myId === null){
                return ;
            }
            if(node.parent?.child(myId-1)?.type === 'single_comment'){
                let start ;
                if(node.parent.child(myId-2) != null ){
                    start = node.parent.child(myId-2)?.endIndex;
                }
                else {
                    start = 0
                }
                let positionStart = editeur.document.positionAt(start?? 0);
                let existingDiag = diags.find(d => d.range.contains(positionStart)); 
                if (!existingDiag) {
                    diags.push(new vscode.Diagnostic(new vscode.Range(positionStart, positionStart.translate(0,1) ), node.toString().slice(1, -1), vscode.DiagnosticSeverity.Error));
                }
            }
            else {
            build_error_display(node, editeur ,node.toString().slice(1,-1));
            }
        }
        else if (node.isError){
            if (node.firstChild && node.firstChild.grammarType === "multi_comment") {
                const childNode = node.child(1);
                if (childNode) {
                  typesOfError(childNode, editeur);
                }
            } 
            else {
                typesOfError(node, editeur);
            }

            diagnostics.set(editeur.document.uri, diags);
            return;
        }
        // This is used to send a warning if there is code after end node 
        else if (node.grammarType === 'end'){
        const endPosition = editor.document.positionAt(node.endIndex);
        const endOfDocumentPosition = editor.document.positionAt(editor.document.getText().length);
        const unreachableRange = new vscode.Range(endPosition, endOfDocumentPosition);
        let unreachableDecoration = vscode.window.createTextEditorDecorationType({
            textDecoration: 'none; opacity: 1; background-color: none; border: none;',
            dark: {
                textDecoration: 'none; opacity: 1; background-color: none; border: none;',
            }
        });
        // I tried to do sth transparent with opacity 0.5 but it brought bugs

        //Part to detect if there is code after the end
        let hasContentAfterEnd = false;
        const text = editor.document.getText();
        let inMultiLineComment = false;
        for (let lineNum = endPosition.line + 1; lineNum <= endOfDocumentPosition.line; lineNum++) {
            const line = text.split('\n')[lineNum];
            // Check if the line is not empty and is not a comment
            if (!inMultiLineComment) {
                if (line.trim().startsWith('/*')) {
                    inMultiLineComment = true;
                } else if (line.trim() !== '' && !line.trim().startsWith('//')) {
                    hasContentAfterEnd = true;
                    break;
                }
            } else {
                if (line.trim().endsWith('*/')) {
                    inMultiLineComment = false;
                }
            }
        }
        
        if (hasContentAfterEnd) {
            // Clear existing decorations
            editor.setDecorations(unreachableDecoration, []);
        
            // Apply new decorations
            editor.setDecorations(unreachableDecoration, [unreachableRange]);
        
            const message = "Code unreachable";
            const severity = vscode.DiagnosticSeverity.Warning;
            const diagnostic = new vscode.Diagnostic(unreachableRange, message, severity);
            diags.push(diagnostic);
        } 

        }

        // Iterate over all the AST
        for (let child of node.children) {
            findMatches(child,editeur);
        }
        
    }

    findMatches(tree.rootNode,editor);

   diagnostics.set(editor.document.uri, diags);

    return tree.rootNode;
    
}


// Main function everytime the document changes create a corresponding symbol table and seex syntax errors, could be improved 
export function display_syntax_errors(context: vscode.ExtensionContext): void {

    const changed_content = vscode.workspace.onDidChangeTextDocument((event) => {
        vscode.window.visibleTextEditors.forEach(async (editor) => {
            if (editor.document === event.document) {
                const tree = await detect_errors(editor);
                if (tree) {
                    const table = createSymbolTable(tree, editor);
                    const fileName = editor.document.uri.path.split('/').pop(); 
                    if (!fileName) {
                        throw new Error('Could not determine file name');
                    }  
                    symbolTables.set(fileName, await table);
                    console.log(symbolTables)   // usefull for debugging symbol table 
                }
            }
        });
    });

    vscode.window.visibleTextEditors.forEach(async (editor) => {
        const tree = await detect_errors(editor);
        if (tree) {
            const table = createSymbolTable(tree, editor);
            const fileName = editor.document.uri.path.split('/').pop();           
            if (!fileName) {
                throw new Error('Could not determine file name');
            }  
            symbolTables.set(fileName, await table);  
        }
    });


    context.subscriptions.push(changed_content, diagnostics);  
}





