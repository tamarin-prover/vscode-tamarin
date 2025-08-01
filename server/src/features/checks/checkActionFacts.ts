import { build_error_display} from './utils';
import { TamarinSymbolTable} from '../../symbol_table/create_symbol_table';
import { TextDocument } from "vscode-languageserver-textdocument";
import { Diagnostic} from 'vscode-languageserver';
import { DeclarationType,TamarinSymbol} from "../../symbol_table/tamarinTypes";

/* This function performs various checks on action facts : wether they are declared ord not and if the arity is correct */ 
export function check_action_fact(currentSymbolTable: TamarinSymbolTable, document: TextDocument, allSymbolTables: Map<string, TamarinSymbolTable>): Diagnostic[] {
    const declaredActionFacts = new Map<string, TamarinSymbol>();
    for (const table of allSymbolTables.values()) {
        for (const symbol of table.getSymbols()) {
            if (symbol.declaration === DeclarationType.ActionF && 
                symbol.context?.grammarType === 'simple_rule') {
                
                if (symbol.name && !declaredActionFacts.has(symbol.name)) {
                    declaredActionFacts.set(symbol.name, symbol);
                }
            }
        }
    }
    const diags: Diagnostic[] = [];
    const symbolsToVerify = currentSymbolTable.getSymbols();
    for (const symbol of symbolsToVerify) {
        if (symbol.declaration === DeclarationType.ActionF && 
            symbol.context?.grammarType !== 'simple_rule') {
            if (!symbol.name) continue;
            const declaration = declaredActionFacts.get(symbol.name);
            if (!declaration) {
                diags.push(build_error_display(
                    symbol.node, 
                    document, 
                    `Error: this action fact '${symbol.name}' is never declared`
                ));
            } 
            else {
                if (declaration.arity !== symbol.arity) {
                    diags.push(build_error_display(
                        symbol.node, 
                        document, 
                        `Error: incoherent arity for action fact '${symbol.name}'. Expected ${declaration.arity}, but got ${symbol.arity}.`
                    ));
                }
            }
        }
    }
    return diags;
}