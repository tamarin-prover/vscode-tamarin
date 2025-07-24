import * as Parser from "web-tree-sitter";
import { get_arity} from '../../symbol_table/utils';
import { TextDocument  } from "vscode-languageserver-textdocument";
import { Diagnostic} from 'vscode-languageserver';
import { build_error_display, build_warning_display, getName } from './utils';
import { ReservedFacts } from "../../symbol_table/tamarinConstants";
import { DeclarationType} from "../../symbol_table/tamarinTypes";

/* Function used to perform checks on all reserved facts,
 checks if they are in the wright place and used with the correct arity */
export function check_reserved_facts(node : Parser.SyntaxNode, editor : TextDocument): Diagnostic[] {
    const diags: Diagnostic[] = [];
    for(const child of node.children){
        if(child.grammarType === DeclarationType.LinearF ||child.grammarType === DeclarationType.PersistentF){
            const fact_name = getName(child.child(0), editor);
            if(fact_name === ReservedFacts[0]){
                if(node.grammarType === 'conclusion'){
                    diags.push(build_warning_display(child, editor,  "Fr fact cannot be used in conclusion of a rule"));
                }
                if( child.child(2)?.children && get_arity(child.child(2)?.children) !== 1){
                    diags.push(build_error_display(child, editor, "Error: incorrect arity for Fr fact, only 1 argument expected"))
                }
            }
            else if(fact_name === ReservedFacts[1]){
                if(node.grammarType === 'conclusion'){
                    diags.push(build_warning_display(child, editor,  "In fact cannot be used in conclusion of a rule"));
                }
                if(child.child(2)?.children && get_arity(child.child(2)?.children) !== 1){
                    diags.push(build_error_display(child, editor, "Error: incorrect arity for In fact, only 1 argument expected"))
                }
            }
            else if(fact_name === ReservedFacts[2]){
                if( node.grammarType === 'premise'){
                    diags.push(build_warning_display(child, editor,  "Out fact cannot be used in premise of a rule"));
                }
                if(child.child(2)?.children && get_arity(child.child(2)?.children) !== 1){
                    diags.push(build_error_display(child, editor, "Error: incorrect arity for Out fact, only 1 argument expected"))
                }
            }
            else if((fact_name === ReservedFacts[3] || fact_name === ReservedFacts[4] || fact_name === ReservedFacts[5]) && node.parent?.grammarType === 'simple_rule' ){
                diags.push(build_warning_display(child, editor,  "You are not supposed to use KD KU or action K in a rule "));
            }
            else if( fact_name === ReservedFacts[6]){
                if(get_arity(child.child(2)?.children) != 2){
                    diags.push(build_error_display(child, editor, "Error : incorrect arity for diff fact, 2 arguments expected"))
                }
            }
        }
        else if (child.grammarType === 'nary_app'){
            const fact_name_node = child.child(0);
            if (fact_name_node !== null && fact_name_node !== undefined) {
                const fact_name = getName(fact_name_node, editor);
                if(fact_name === ReservedFacts[6]){
                    if(node.grammarType === DeclarationType.Equation || node.grammarType === 'mset_term'){
                        diags.push(build_warning_display(child, editor , "Warning  :  diff fact cannot be used in an equation"))
                    }
                }
            }
        }
        else {
            diags.push(...check_reserved_facts(child, editor));
        }
    }
    return diags;
    
}