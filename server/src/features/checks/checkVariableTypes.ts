import { build_error_display} from './utils';
import { TamarinSymbolTable} from '../../symbol_table/create_symbol_table';
import { TextDocument } from "vscode-languageserver-textdocument";
import { Diagnostic} from 'vscode-languageserver';
import { DeclarationType} from "../../symbol_table/tamarinTypes";

const variableDeclarationTypes = [
    DeclarationType.PRVariable,
    DeclarationType.CCLVariable,
    DeclarationType.ActionFVariable,
    DeclarationType.LemmaVariable,
];

/* Function used to check if all variables with the same name  in a rule have the same type,
Also checks that if a variables is in the right side of a macro or equation it is also present in the left side  */
export function check_variables_type_is_consistent_inside_a_rule(symbol_table : TamarinSymbolTable, editor: TextDocument) : Diagnostic[]{
    const diags : Diagnostic[] = [];
    for (let i = 0 ; i < symbol_table.getSymbols().length; i++){
        const current_symbol = symbol_table.getSymbol(i);
        if(variableDeclarationTypes.includes(current_symbol.declaration)){
            for(let j = 0; j < symbol_table.getSymbols().length; j++){
                if(variableDeclarationTypes.includes(symbol_table.getSymbol(j).declaration) && i !== j){
                    if(current_symbol.context === symbol_table.getSymbol(j).context && current_symbol.name === symbol_table.getSymbol(j).name){
                        if(current_symbol.type === symbol_table.getSymbol(j).type){
                            continue;
                        }
                        else{
                            const newDiag =build_error_display(current_symbol.node, editor, "Error: inconsistent variables, variables with the same name in the same rule must have same types ");
                            diags.push(newDiag);
                            break;
                        }
                    }
                    else {
                        continue;
                    }
                }
                else{
                    continue;
                }
            }
        }
        // Check about the equation variables
        else if (current_symbol.declaration === DeclarationType.REquationVariable){
            let isbreak = false;
            for (const symbol of symbol_table.getSymbols()){
                if(symbol.declaration === DeclarationType.LEquationVariable && symbol.name === current_symbol.name && symbol.context === current_symbol.context){
                    isbreak = true;
                    break;
                }
            }
            if (!isbreak){
                const newDiag=build_error_display(current_symbol.node, editor, "Error : this variable doesn't exist on the left side of the equation")
                diags.push(newDiag);
            }
        }
        // Check about macro variables 
        else if (current_symbol.declaration === DeclarationType.RMacroVariable){
            let isbreak = false;
            if(current_symbol.type === '$'){
                continue;
            }
            for (const symbol of symbol_table.getSymbols()){
                if(symbol.declaration === DeclarationType.LMacroVariable && symbol.name === current_symbol.name && symbol.context === current_symbol.context){
                    isbreak = true;
                    break;
                }
            }
            if (!isbreak){
                const newDiag=build_error_display(current_symbol.node, editor, "Error : this variable doesn't exist on the left side of the equation")
                diags.push(newDiag);
            }
        }
        else{
            continue;
        }
    }
    return diags;
}