import { build_error_display , levenshteinDistance } from './utils';
import { TamarinSymbolTable} from '../../symbol_table/create_symbol_table';
import { TextDocument } from "vscode-languageserver-textdocument";
import { Diagnostic , DiagnosticSeverity} from 'vscode-languageserver';
import { DeclarationType, TamarinSymbol} from "../../symbol_table/tamarinTypes";
/* Function to check macros, functions, facts arity and to provide
 quick fixes for wrong function name still using leverstein distance */

export function check_function_macros_and_facts_arity(symbol_table : TamarinSymbolTable, editor: TextDocument): Diagnostic[]{
    const diags : Diagnostic[] = [];
    const known_functions : TamarinSymbol[] = [];
    const errors : string[] = []
    function getNames(list : TamarinSymbol[]): string[]{
        const str_list : string[] = [];
        for(const symbol of list){
            if(symbol.name){
                str_list.push(symbol.name);
            }
        }
        return str_list;
    }
    for( let i = 0; i < symbol_table.getSymbols().length; i++){
        const current_symbol = symbol_table.getSymbol(i);
        if(symbol_table.getSymbol(i).declaration === DeclarationType.LinearF || symbol_table.getSymbol(i).declaration === DeclarationType.PersistentF || symbol_table.getSymbol(i).declaration === DeclarationType.Functions || symbol_table.getSymbol(i).declaration === DeclarationType.NARY || symbol_table.getSymbol(i).declaration === DeclarationType.Macro){
            if(current_symbol.name){
                if(getNames(known_functions).includes(current_symbol.name)){
                    for(let k = 0 ; k < known_functions.length; k ++){
                        if(current_symbol.name === known_functions[k].name ){
                            if(current_symbol.arity === known_functions[k].arity||current_symbol.arity ===0){
                                break;
                            }
                            else{
                                if(current_symbol.declaration === DeclarationType.NARY){
                                    diags.push(build_error_display(current_symbol.node, editor, "Error : incorrect arity for this function, "+ known_functions[k].arity + " arguments required"))                                  
                                }
                                else if( current_symbol.declaration === DeclarationType.LinearF || current_symbol.declaration === DeclarationType.PersistentF){
                                    errors.push(current_symbol.name);                                    
                                    
                                }
                                else if (current_symbol.declaration === DeclarationType.Macro){
                                    errors.push(current_symbol.name)
                                }
                            }
                        }
                        else{
                            continue;
                        }
                    }
                }
                else{
                    known_functions.push(current_symbol)
                }
            }
        }
    }
    for(const symbol of symbol_table.getSymbols()){
        if(symbol.name)
        if(errors.includes(symbol.name)){
            diags.push(build_error_display(symbol.node, editor, " Error : incoherent arity"))
        }
    }
    for(const symbol of known_functions){
        let isbreak = false;
        if(symbol.declaration === DeclarationType.NARY){
            for( const functionSymbol of known_functions){
                if(functionSymbol.name === symbol.name && functionSymbol !== symbol){
                    isbreak = true;
                    break;
                }
            }
            if(!isbreak){
                diags.push(build_error_display(symbol.node, editor, "Error : unknown function or macro"));
                for(const functionSymbol of known_functions){
                    if (typeof symbol.name === 'string' && typeof functionSymbol.name === 'string'&& symbol.name !== functionSymbol.name && symbol.arity === functionSymbol.arity ) {
                        const distance = levenshteinDistance(symbol.name, functionSymbol.name);
                        if (distance < 3) { // threshold value
                            const diagnostic: Diagnostic = {
                                range: symbol.name_range,
                                message: "Warning: did you mean " + functionSymbol.name + " ? (" + distance + " characters away)",
                                severity: DiagnosticSeverity.Warning,
                                source: "tamarin",
                                code: "wrongFunctionName"
                            };
                            diags.push(diagnostic);
                        }
                    }
                }
            }
        }
    }
    return diags
}    