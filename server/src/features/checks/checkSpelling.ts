import { levenshteinDistance, build_error_display } from './utils';
import { TamarinSymbolTable} from '../../symbol_table/create_symbol_table';
import { TextDocument } from "vscode-languageserver-textdocument";
import { Diagnostic , DiagnosticSeverity} from 'vscode-languageserver';
import { DeclarationType} from "../../symbol_table/tamarinTypes";

/* Function used to check the speling of facts, also provides a quick fix for the wrong ones using leverstein distance */
export function check_case_sensitivity(currentSymbolTable: TamarinSymbolTable, document: TextDocument,allSymbolTables: Map<string, TamarinSymbolTable>): Diagnostic[] {
    const knownFactNames = new Set<string>();
    for (const table of allSymbolTables.values()) {
        for (const symbol of table.getSymbols()) {
            const isActionFactDeclaration = (
                symbol.declaration === DeclarationType.ActionF && 
                symbol.context?.grammarType === 'simple_rule'
            );
            const isFactInConclusion = (
                (symbol.declaration === DeclarationType.LinearF || symbol.declaration === DeclarationType.PersistentF) &&
                symbol.node.parent?.grammarType === DeclarationType.Conclusion
            );
            if (symbol.name && (isActionFactDeclaration || isFactInConclusion)) {
                knownFactNames.add(symbol.name);
            }
        }
    }
    const diags: Diagnostic[] = [];
    for (const symbol of currentSymbolTable.getSymbols()) {
        if (symbol.declaration === DeclarationType.LinearF || 
            symbol.declaration === DeclarationType.PersistentF ||  
            symbol.declaration === DeclarationType.ActionF) {
            if (!symbol.name) continue;
            if (!(symbol.name.charCodeAt(0) >= 65 && symbol.name.charCodeAt(0) <= 90)) {
                diags.push(build_error_display(symbol.node, document, "Error: facts must start with an uppercase"));
            }
            if (!knownFactNames.has(symbol.name)) {
                for (const knownName of knownFactNames) {
                    const distance = levenshteinDistance(symbol.name, knownName);
                    if (distance > 0 && distance < 3) {
                        diags.push({
                            range: symbol.name_range,
                            message: `Warning: did you mean '${knownName}'?`,
                            severity: DiagnosticSeverity.Warning,
                            source: "tamarin",
                            code: "wrongFactName"
                        });
                        break; 
                    }
                }
            }
        }
    }
    return diags;
}