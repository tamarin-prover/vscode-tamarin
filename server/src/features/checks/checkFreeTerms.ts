import * as Parser from "web-tree-sitter";
import { TamarinSymbolTable, set_associated_qf } from '../../symbol_table/create_symbol_table';
import { TextDocument } from "vscode-languageserver-textdocument";
import { Diagnostic } from 'vscode-languageserver';
import { build_warning_display, get_child_grammar_type } from './utils';
import { DeclarationType, TamarinSymbol} from "../../symbol_table/tamarinTypes";

/* Function used to check if a term is associated to a quantified formula in a lemma */ 
export function check_free_term_in_lemma(symbol_table : TamarinSymbolTable, editor: TextDocument): Diagnostic[]{
    const diags : Diagnostic[] = [];
    const lemma_vars : TamarinSymbol[] = [];
    for (const symbol of symbol_table.getSymbols()){
        if(symbol.declaration === DeclarationType.LemmaVariable || symbol.declaration === DeclarationType.RestrictionVariable){
            lemma_vars.push(symbol);
        }
    }
    for( let i = 0; i < lemma_vars.length; i++){
        if(lemma_vars[i].node.parent?.grammarType === DeclarationType.QF){
            set_associated_qf(lemma_vars[i], lemma_vars[i].node.parent)
            continue;
        }
        let context: Parser.SyntaxNode | null = lemma_vars[i].context;
        let globalisbreak = false;
        while(context?.grammarType !== 'theory' && context){
            const context_child_id: number[] = [];
            if(context?.children){
                let search_context = context
                let gt_list = get_child_grammar_type(search_context)
                while(search_context.child(0)?.grammarType === 'conjunction' || search_context.child(0)?.grammarType === 'disjunction' || gt_list.includes('imp') ){
                    if(gt_list.includes('imp')){
                    context_child_id.push((search_context.child(gt_list.indexOf('imp')) as {id:number}).id)
                    search_context = search_context.child(gt_list.indexOf('imp')) as Parser.SyntaxNode
                    gt_list = get_child_grammar_type(search_context);
                    }
                    else if(search_context.child(0)){
                    context_child_id.push((search_context.child(0) as {id:number}).id)
                    search_context = search_context.child(0) as Parser.SyntaxNode
                    gt_list = get_child_grammar_type(search_context);
                    } 
                }
                // Simultaneously defining context for rename feature
                if(search_context.grammarType === DeclarationType.Lemma || search_context.grammarType === DeclarationType.Restriction || search_context.grammarType === 'diff_lemma'){
                    set_associated_qf(lemma_vars[i], search_context.child(4));
                }
                else if(search_context.grammarType === DeclarationType.NF){
                    set_associated_qf(lemma_vars[i], search_context.child(1))
                }
                else{
                    set_associated_qf(lemma_vars[i], search_context.child(0));
                }
            }
            let isbreak = false ;
            for (let j  = 0; j < lemma_vars.length; j++){
                if((lemma_vars[j].context?.id === context?.id || context_child_id.includes((lemma_vars[j].context as {id : number}).id)) && lemma_vars[j].node.parent?.grammarType === DeclarationType.QF && lemma_vars[j].name === lemma_vars[i].name){
                    isbreak = true;
                    break;
                }
                
            }
            if(isbreak){
                globalisbreak = true;
                break;
            }
            else {
                context = context?.parent
            }
        }
        
        if(!globalisbreak){
            diags.push(build_warning_display(lemma_vars[i].node, editor, "Warning : free term in lemma or restriction formula"))
        }
    }
    return diags;
}