import { build_error_display} from './utils';
import { TamarinSymbolTable} from '../../symbol_table/create_symbol_table';
import { TextDocument } from "vscode-languageserver-textdocument";
import { Diagnostic} from 'vscode-languageserver';
import { DeclarationType,TamarinSymbol} from "../../symbol_table/tamarinTypes";

/* This function performs various checks on action facts : wether they are declared ord not and if the arity is correct */ 
export function check_action_fact(symbol_table : TamarinSymbolTable, editor: TextDocument): Diagnostic[]{
    const diags : Diagnostic[] = [];
    const actionFacts: TamarinSymbol[] = [];
    const errors : string[] = []
    for( let i = 0 ; i < symbol_table.getSymbols().length; i++){
        const current_symbol = symbol_table.getSymbol(i);
        if(current_symbol.declaration === DeclarationType.ActionF && current_symbol.context?.grammarType !== 'simple_rule'){
            let found_one = false;
            for(let j = 0; j < actionFacts.length; j++){
                if(actionFacts[j].name === current_symbol.name){
                    found_one = true;
                    if(!(actionFacts[j].arity === current_symbol.arity)){
                        if(current_symbol.name)
                        errors.push(current_symbol.name)
                    }
                }
                else{
                    continue;
                }
            }
            if(!found_one){
                diags.push(build_error_display(current_symbol.node, editor, "Error: this action fact is never declared"))
            }
        }
        else if (current_symbol.declaration === DeclarationType.ActionF && current_symbol.context?.grammarType === 'simple_rule'){
            actionFacts.push(current_symbol)
        }
        else{
            continue;
        }
    }
    for(const symbol of symbol_table.getSymbols()){
        if(symbol.name)
        if(errors.includes(symbol.name)){
            diags.push(build_error_display(symbol.node, editor, " Error : incoherent arity"))
        }
    }
    return diags
}