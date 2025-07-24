import { build_error_display} from './utils';
import { TamarinSymbolTable} from '../../symbol_table/create_symbol_table';
import { TextDocument } from "vscode-languageserver-textdocument";
import { Diagnostic} from 'vscode-languageserver';

export function check_equality_types(symbol_table : TamarinSymbolTable, editor: TextDocument): Diagnostic[]{
    const diags : Diagnostic[] = [];
    for(let i =0; i < symbol_table.getSymbols().length; i++){
        const symbol= symbol_table.getSymbol(i);
        if(symbol.context.grammarType === 'temp_var_eq' ||symbol.context.grammarType === 'term_eq'){ //both nodes are used in equalites
            i++; //only the left side of the equation needs to be checked
            const type = symbol.type;
            const name = symbol.name;
            const declaration = symbol.declaration;
            let verified = false;
            for(const compared_symbol of symbol_table.getSymbols()){
                if(compared_symbol.name=== name && compared_symbol.declaration === declaration && !verified){
                    if(compared_symbol.type !== type){
                        diags.push(build_error_display(symbol.node, editor, "Error : the type of the variable is not the same as declared before"));
                    }
                    verified = true;
                }
            }
        }
    }
    return diags;
}