import {build_error_display} from './utils';
import { TamarinSymbolTable} from '../../symbol_table/create_symbol_table';
import { TextDocument } from "vscode-languageserver-textdocument";
import { Diagnostic} from 'vscode-languageserver';
import { DeclarationType} from "../../symbol_table/tamarinTypes";



/* Function to check that a macro is not used in an equation */ 
export function check_macro_not_in_equation(symbol_table : TamarinSymbolTable, editor: TextDocument): Diagnostic[]{
    const diags : Diagnostic[] = [];
    for(const symbol of symbol_table.getSymbols()){
        if(symbol.declaration === DeclarationType.NARY){
            for ( const macros of symbol_table.getSymbols()){
                if(macros.declaration === DeclarationType.Macro && macros.name === symbol.name && symbol.context.grammarType === DeclarationType.Equation){
                    diags.push(build_error_display(symbol.node, editor, "Error : a macro shoud not be used in an equation "))
                }
            }
        }
    }
    return diags
}