import { levenshteinDistance, build_error_display } from './utils';
import { TamarinSymbolTable} from '../../symbol_table/create_symbol_table';
import { TextDocument } from "vscode-languageserver-textdocument";
import { Diagnostic , DiagnosticSeverity ,Range} from 'vscode-languageserver';
import { DeclarationType,TamarinSymbol} from "../../symbol_table/tamarinTypes";

/* Function used to check the speling of facts, also provides a quick fix for the wrong ones using leverstein distance */
export function check_case_sensitivity(symbol_table : TamarinSymbolTable, editor:  TextDocument): Diagnostic[]{
    const diags: Diagnostic[] = [];
    const facts : TamarinSymbol["name"][]  = [];
    let count = 0;
    for( let i = 0 ; i < symbol_table.getSymbols().length; i++){
        const current_symbol = symbol_table.getSymbol(i);
        if(current_symbol.declaration === DeclarationType.LinearF || current_symbol.declaration ===
        DeclarationType.PersistentF ||  current_symbol.declaration === DeclarationType.ActionF ){
            const name  = current_symbol.name;
            if(name){
                //Checks if fact name is correct -------
                if(!(name.charCodeAt(0) >= 65  && name.charCodeAt(0) <= 90)){
                    const newDiag = build_error_display(current_symbol.node, editor, "Error: facts must start with an uppercase")
                    diags.push(newDiag);
                }
                if((current_symbol.declaration === DeclarationType.ActionF && current_symbol.context?.grammarType === 'simple_rule')){
                    facts.push(current_symbol.name);
                    continue;
                }
                if((current_symbol.declaration === DeclarationType.LinearF || current_symbol.declaration === DeclarationType.PersistentF) && current_symbol.node.parent?.grammarType === DeclarationType.Conclusion){
                    facts.push(current_symbol.name)
                    continue;
                }
                //FIXME : doesn't work in inverse order 
                for( let j = 0; j < facts.length ; j++ ){
                    const name2 = facts[j];
                    if(name2){
                        if(  name2 === name  && i !== j ){
                            continue;
                        }
                        const distance = levenshteinDistance(name, name2);
                        if (distance < 3 && !facts.includes(current_symbol.name)) { // threshold value
                            const start = editor.positionAt(current_symbol.node.startIndex);
                            const end = editor.positionAt(current_symbol.node.endIndex > current_symbol.node.startIndex ? current_symbol.node.endIndex : current_symbol.node.startIndex + 1);
                            const diagnostic: Diagnostic = {
                                range: Range.create(start, end),
                                message: "Warning: did you mean " + name2 + " ? (" + distance + " characters away)",
                                severity: DiagnosticSeverity.Warning,
                                source: "tamarin",
                                code: "wrongFactName"
                            };
                            diags.push(diagnostic);
                            count ++
                        }
                    }
                }
            }
        }
        if(count > 0){break;}
    }
    return diags
}