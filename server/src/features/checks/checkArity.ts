import { build_error_display , levenshteinDistance } from './utils';
import { TamarinSymbolTable} from '../../symbol_table/create_symbol_table';
import { TextDocument } from "vscode-languageserver-textdocument";
import { Diagnostic , DiagnosticSeverity} from 'vscode-languageserver';
import { DeclarationType, TamarinSymbol} from "../../symbol_table/tamarinTypes";
/* Function to check macros, functions, facts arity and to provide
 quick fixes for wrong function name still using leverstein distance */

export function check_function_macros_and_facts_arity(currentSymbolTable: TamarinSymbolTable, document: TextDocument, allSymbolTables: Map<string, TamarinSymbolTable>): Diagnostic[] {
    const knownDeclarations = new Map<string, TamarinSymbol>();
    for (const table of allSymbolTables.values()) {
        for (const symbol of table.getSymbols()) {
            if (symbol.declaration === DeclarationType.Functions ||
                symbol.declaration === DeclarationType.Macro ||
                symbol.declaration === DeclarationType.LinearF ||
                symbol.declaration === DeclarationType.PersistentF) {
                if (symbol.name && !knownDeclarations.has(symbol.name)) {
                    knownDeclarations.set(symbol.name, symbol);
                }
            }
        }
    }
    const diags: Diagnostic[] = [];
    const symbolsToVerify = currentSymbolTable.getSymbols();
    for (const symbol of symbolsToVerify) {
        if (symbol.declaration !== DeclarationType.NARY) {
            continue;
        }
        if (!symbol.name) {
            continue;
        }
        const declaration = knownDeclarations.get(symbol.name);
        if (!declaration) {
            diags.push(build_error_display(symbol.node, document, `Error: unknown function, macro, or fact '${symbol.name}'`));
            for (const [knownName, knownSymbol] of knownDeclarations.entries()) {
                if (symbol.arity === knownSymbol.arity) {
                    const distance = levenshteinDistance(symbol.name, knownName);
                    if (distance > 0 && distance < 3) {
                        diags.push({
                            range: symbol.name_range,
                            message: `Warning: did you mean '${knownName}'?`,
                            severity: DiagnosticSeverity.Warning,
                            source: "tamarin",
                            code: "wrongFunctionName"
                        });
                        break;
                    }
                }
            }
        }
        else {
            if (symbol.arity !== 0 && declaration.arity !== symbol.arity) {
                diags.push(build_error_display(
                    symbol.node, 
                    document, 
                    `Error: incorrect arity for '${symbol.name}'. Expected ${declaration.arity}, but got ${symbol.arity}.`
                ));
            }
        }
    }   
    return diags;
}