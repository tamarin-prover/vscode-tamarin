import * as Parser from "web-tree-sitter";
import { TamarinSymbolTable} from '../../symbol_table/create_symbol_table';
import { getName } from './utils';
import { TextDocument } from "vscode-languageserver-textdocument";
import { Diagnostic , DiagnosticSeverity} from 'vscode-languageserver';
import { DeclarationType, TamarinSymbol} from "../../symbol_table/tamarinTypes";

/* Given a symbol table returns all the builtins present in it */ 
function return_builtins(symbol_table: TamarinSymbolTable): TamarinSymbol[]{
const builtins : TamarinSymbol[]  = [];
    for (const symbol of symbol_table.getSymbols()){
        if(symbol.declaration === DeclarationType.Builtin){
            builtins.push(symbol);
        }
    } 
    return builtins;
}

/* Given a list of builtins returns there name */
function get_builtins_name(builtins : TamarinSymbol[]): string[]{
    const Sbuiltins : string[] = [];
    for (const builtin of builtins ){
        if(builtin.name)
        Sbuiltins.push(builtin.name)
    }
    return Sbuiltins;
}

function return_functions(symbol_table: TamarinSymbolTable): string[]{
    const builtins : string[]  = [];
        for (const symbol of symbol_table.getSymbols()){
            if(symbol.declaration === DeclarationType.Functions && symbol.name){
                builtins.push(symbol.name);
            }
        } 
        return builtins;
    }

/* Function used to check if the use of * ^ or others symbol is allowed, if not provides a quick fix to include the right builtin,
Also works with functions defined in builtins*/ 
export function check_infix_operators(symbol_table : TamarinSymbolTable, editor : TextDocument, root : Parser.SyntaxNode): Diagnostic[]{
    const diags : Diagnostic[] = [];
    function display_infix_error(builtin: string, symbol: string, child: Parser.SyntaxNode): void {
        const current_builtins = return_builtins(symbol_table);
        const current_functions = return_functions(symbol_table)
        if (!get_builtins_name(current_builtins).includes(builtin) && !current_functions.includes(getName(child.child(0), editor))) {
            if(current_builtins.length > 0){
            const diagnostic: Diagnostic = {
                range: current_builtins[current_builtins.length - 1].name_range ,
                message: "Error : symbol " + symbol + " cannot be used without " + builtin + " builtin",
                severity: DiagnosticSeverity.Warning,
                source: "tamarin",
                code: "missingBuiltin"
            };
            diags.push(diagnostic);
            }
        }
      }
    if (!root || !root.children || root.children.length === 0) {
        return [];
    }  
    for (const child of root.children){
        let errorFound = false;
        if(child.grammarType === '^' || child.grammarType === '*'){
            const current_builtins = return_builtins(symbol_table);
            if(! get_builtins_name(current_builtins).includes('diffie-hellman')){
                display_infix_error('diffie-hellman', '^ or *', child);
                errorFound = true; 
                }
        }
        else if (child.grammarType === '⊕'){
            display_infix_error('xor','⊕', child);
            errorFound = true;
        }
        else if (child.grammarType === '++'){
            display_infix_error('multiset', '++', child);
            errorFound = true;
        }
        else if (child.grammarType === '%+'){
            display_infix_error('natural-numbers', '%+', child);
            errorFound = true;
        }
        else if (child.grammarType === DeclarationType.NARY){
            if(getName(child.child(0),editor) === 'inv'){
                display_infix_error('diffie-hellman', 'inv', child);
                errorFound = true;
            }
            else if (getName(child.child(0),editor) === 'h'){
                display_infix_error('hashing', 'h', child);
                errorFound = true;
            }
            else if (getName(child.child(0), editor) === 'sdec' || getName(child.child(0), editor) === 'senc'){
                display_infix_error('symmetric-encryption', 'sdec or senc' , child);
                errorFound = true;
            }
            else if (getName(child.child(0), editor) === 'adec' || getName(child.child(0), editor) === 'aenc'){
                display_infix_error('asymmetric-encryption', 'adec or aenc' , child);
                errorFound = true;
            }
            else if (getName(child.child(0), editor) === 'sign' || getName(child.child(0), editor) === 'verify'){
                display_infix_error('signing', 'sign or verify' , child);
                errorFound = true;
            }
            else if (getName(child.child(0), editor) === 'revealSign' || getName(child.child(0), editor) === 'revealVerify' || getName(child.child(0), editor) === 'getMessage'){
                display_infix_error('revealing-signing', 'revealSign or revealVerify or getMessage' , child);
                errorFound = true;
            }
            else if (getName(child.child(0), editor) === 'pmult' || getName(child.child(0), editor) === 'em'){
                display_infix_error('bilinear-pairing', 'pmult or em' , child);
                errorFound = true;
            }
            else if (getName(child.child(0),editor) === 'XOR'){
                display_infix_error('xor', 'XOR', child);
                errorFound = true;  
            }
        }
        if(!errorFound){
            diags.push(...check_infix_operators(symbol_table,editor,child));
        }
    }
    return diags;
}