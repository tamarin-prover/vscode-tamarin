import * as vscode from 'vscode'
import Parser = require("web-tree-sitter");
import { ReservedFacts, DeclarationType, TamarinSymbolTable, TamarinSymbol, get_arity, set_associated_qf } from '../symbol_table/create_symbol_table';
import { getName } from './syntax_errors';




function build_error_display(node : Parser.SyntaxNode, editeur: vscode.TextEditor, diags : vscode.Diagnostic[], message : string): vscode.Diagnostic{
    let start = node.startIndex;
    let end  = node.endIndex;
    let positionStart = editeur.document.positionAt(start);
    let positionEnd = editeur.document.positionAt(end);
    let diag = new vscode.Diagnostic(new vscode.Range(positionStart, positionEnd ), message, vscode.DiagnosticSeverity.Error);
    diags.push(diag);
    return diag;
}

function build_warning_display(node : Parser.SyntaxNode, editeur: vscode.TextEditor, diags : vscode.Diagnostic[], message : string): vscode.Diagnostic{
    let start = node.startIndex;
    let end  = node.endIndex;
    let positionStart = editeur.document.positionAt(start);
    let positionEnd = editeur.document.positionAt(end);
    let diag = new vscode.Diagnostic(new vscode.Range(positionStart, positionEnd ), message, vscode.DiagnosticSeverity.Warning);
    diags.push(diag);
    return diag;
}


/* Function used to compare the distance between two strings,
 returns the minimum operations required to convert the first string into the second one */
function levenshteinDistance(s1: string , s2 : string): number {
    const matrix = [];

    // increment along the first column of each row
    for (let i = 0; i <= s2.length; i++) {
        matrix[i] = [i];
    }

    // increment each column in the first row
    for (let j = 0; j <= s1.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= s2.length; i++) {
        for (let j = 1; j <= s1.length; j++) {
            if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1 // deletion
                    )
                );
            }
        }
    }

    return matrix[s2.length][s1.length];
}

// Function to get the grammar type of a node 
function get_child_grammar_type(node :Parser.SyntaxNode): string[]{
    let results : string[] = []
    for(let child of node.children) {
        results.push(child.grammarType)
    }
    return results;
}


/* Function used to perform checks on all reserved facts,
 checks if they are in the wright place and used with the correct arity */
export function check_reserved_facts(node : Parser.SyntaxNode, editor : vscode.TextEditor, diags : vscode.Diagnostic[]): void{
    for(let child of node.children){
        if(child.grammarType === DeclarationType.LinearF ||child.grammarType === DeclarationType.PersistentF){
            const fact_name = getName(child.child(0), editor);
            if(fact_name === ReservedFacts[0]){
                if(node.grammarType === 'conclusion'){
                    build_warning_display(child, editor, diags,  "Fr fact cannot be used in conclusion of a rule");
                }
                if( child.child(2)?.children && get_arity(child.child(2)?.children) !== 1){
                    build_error_display(child, editor, diags, "Error: incorrect arity for Fr fact, only 1 argument expected")
                }
            }
            else if(fact_name === ReservedFacts[1]){
                if(node.grammarType === 'conclusion'){
                    build_warning_display(child, editor, diags,  "In fact cannot be used in conclusion of a rule");
                }
                if(child.child(2)?.children && get_arity(child.child(2)?.children) !== 1){
                    build_error_display(child, editor, diags, "Error: incorrect arity for In fact, only 1 argument expected")
                }
            }
            else if(fact_name === ReservedFacts[2]){
                if( node.grammarType === 'premise'){
                    build_warning_display(child, editor, diags,  "Out fact cannot be used in premise of a rule");
                }
                if(child.child(2)?.children && get_arity(child.child(2)?.children) !== 1){
                    build_error_display(child, editor, diags, "Error: incorrect arity for Out fact, only 1 argument expected")
                }
            }
            else if((fact_name === ReservedFacts[3] || fact_name === ReservedFacts[4] || fact_name === ReservedFacts[5]) && node.parent?.grammarType === 'simple_rule' ){
                build_warning_display(child, editor, diags,  "You are not supposed to use KD KU or action K in a rule ");
            }
            else if( fact_name === ReservedFacts[6]){
                if(get_arity(child.child(2)?.children) != 2){
                    build_error_display(child, editor, diags, "Error : incorrect arity for diff fact, 2 arguments expected")
                }
            }
        }
        else if (child.grammarType === 'nary_app'){
            const fact_name_node = child.child(0);
            if (fact_name_node !== null && fact_name_node !== undefined) {
                const fact_name = getName(fact_name_node, editor);
                if(fact_name === ReservedFacts[6]){
                    if(node.grammarType === DeclarationType.Equation || node.grammarType === 'mset_term'){
                        build_warning_display(child, editor, diags , "Warning  :  diff fact cannot be used in an equation")
                    }
                }
            }
        }
        else {
            check_reserved_facts(child, editor, diags)
        }
    }
    
};

/* Function used to check if all variables with the same name  in a rule have the same type,
Also checks that if a variables is in the right side of a macro or equation it is also present in the left side  */
//A optimiser peut être 
function check_variables_type_is_consistent_inside_a_rule(symbol_table : TamarinSymbolTable, editor: vscode.TextEditor, diags:vscode.Diagnostic[]) : void{
    for (let i = 0 ; i < symbol_table.getSymbols().length; i++){
        let current_symbol = symbol_table.getSymbol(i);
        if(current_symbol.declaration === DeclarationType.PRVariable || current_symbol.declaration === DeclarationType.CCLVariable || current_symbol.declaration === DeclarationType.ActionFVariable ){
            for(let j = 0; j < symbol_table.getSymbols().length; j++){
                if((current_symbol.declaration === DeclarationType.PRVariable || current_symbol.declaration === DeclarationType.CCLVariable || current_symbol.declaration === DeclarationType.ActionFVariable) && i !== j){
                    if(current_symbol.context === symbol_table.getSymbol(j).context && current_symbol.name === symbol_table.getSymbol(j).name){
                        if(current_symbol.type === symbol_table.getSymbol(j).type){
                            continue;
                        }
                        else{
                            build_error_display(current_symbol.node, editor, diags, "Error: inconsistent variables, variables with the same name in the same rule must have same types ");
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
            for (let symbol of symbol_table.getSymbols()){
                if(symbol.declaration === DeclarationType.LEquationVariable && symbol.name === current_symbol.name && symbol.context === current_symbol.context){
                    isbreak = true;
                    break;
                }
            }
            if (!isbreak){
                build_error_display(current_symbol.node, editor, diags, "Error : this variable doesn't exist on the left side of the equation")
            }
        }
        // Check about macro variables 
        else if (current_symbol.declaration === DeclarationType.RMacroVariable){
            let isbreak = false;
            if(current_symbol.type === '$'){
                continue;
            }
            for (let symbol of symbol_table.getSymbols()){
                if(symbol.declaration === DeclarationType.LMacroVariable && symbol.name === current_symbol.name && symbol.context === current_symbol.context){
                    isbreak = true;
                    break;
                }
            }
            if (!isbreak){
                build_error_display(current_symbol.node, editor, diags, "Error : this variable doesn't exist on the left side of the equation")
            }
        }
        else{
            continue;
        }
    }
};

/* Function used to check the speling of facts, also provides a quick fix for the wrong ones using leverstein distance */
function check_case_sensitivity(symbol_table : TamarinSymbolTable, editor: vscode.TextEditor, diags: vscode.Diagnostic[]): void{
    const facts : TamarinSymbol["name"][]  = [];
    let count = 0;
    for( let i = 0 ; i < symbol_table.getSymbols().length; i++){
        let current_symbol = symbol_table.getSymbol(i);
        if(current_symbol.declaration === DeclarationType.LinearF || current_symbol.declaration ===
        DeclarationType.PersistentF ||  current_symbol.declaration === DeclarationType.ActionF ){
            const name  = current_symbol.name;
            if(name){
                //Checks if fact name is correct -------
                if(!(name.charCodeAt(0) >= 65  && name.charCodeAt(0) <= 90)){
                    build_error_display(current_symbol.node, editor, diags, "Error: facts must start with an uppercase")
                }
                if((current_symbol.declaration === DeclarationType.ActionF && current_symbol.context?.grammarType === 'simple_rule')){
                    facts.push(current_symbol.name);
                    continue;
                }
                if((current_symbol.declaration === DeclarationType.LinearF || current_symbol.declaration === DeclarationType.PersistentF) && current_symbol.node.parent?.grammarType === DeclarationType.Conclusion){
                    facts.push(current_symbol.name)
                    continue;
                }
                //---------
                for( let j = 0; j < facts.length ; j++ ){
                    const name2 = facts[j];
                    if(name2){
                        if(  name2 === name  && i !== j ){
                            continue;
                        }
                        const distance = levenshteinDistance(name, name2);
                        if (distance < 3 && !facts.includes(current_symbol.name)) { // threshold value
                            const diagnostic = build_warning_display(current_symbol.node, editor, diags, "Warning: did you mean " + name2 + " ? (" + distance + " characters away)")
                            diagnostic.code = "wrongFactName";
                            const range = current_symbol.name_range;
                            const fix = new vscode.CodeAction("Replace with " + name2, vscode.CodeActionKind.QuickFix);
                            fix.edit = new vscode.WorkspaceEdit();
                            fix.edit.replace(editor.document.uri, range, name2);
                            fix.diagnostics = [diagnostic];
                            fix.isPreferred = true;
                            fixMap.set(diagnostic, fix);
                            count ++
                        }
                    }
                }
            }
        }
        if(count > 0){break;}
    };
};



/* Function used to check if a variable present in an action fact or conclusion is also present in premise,
also checks if a fact in premise appears in a conclusion somewhere else */ 
function check_variable_is_defined_in_premise(symbol_table : TamarinSymbolTable, editor: vscode.TextEditor, diags: vscode.Diagnostic[]):void{
    for( let i = 0 ; i < symbol_table.getSymbols().length; i++){
        let current_symbol = symbol_table.getSymbol(i);
        if(current_symbol.type === '$'){continue};  // Do not take into account public variables
        if(current_symbol.declaration === DeclarationType.CCLVariable || current_symbol.declaration === DeclarationType.ActionFVariable){
            let current_context = current_symbol.context;
            let is_break = false;
            for (let j = 0; j < symbol_table.getSymbols().length; j++){
                let searched_symbol = symbol_table.getSymbol(j);
                if(j > i){break};
                if(searched_symbol.context !== current_context || j == i){
                    continue;
                }
                else{
                    if(searched_symbol.name === current_symbol.name){
                        is_break = true
                        break;
                    }
                }
            }
            if(!is_break){
                build_error_display(current_symbol.node, editor, diags, "Error: this variable is used in the second part of the rule but doesn't appear in premise");
            }
        }
        else if ((current_symbol.declaration === DeclarationType.LinearF || current_symbol.declaration === DeclarationType.PersistentF) && current_symbol.node.parent?.grammarType === DeclarationType.Premise){
            let isbreak = false;
            for (let symbol of symbol_table.getSymbols()){
                if((symbol.declaration === DeclarationType.LinearF || symbol.declaration === DeclarationType.PersistentF ) && symbol.node.id !== current_symbol.node.id ){
                    if(symbol.node.parent?.grammarType === DeclarationType.Conclusion && symbol.name === current_symbol.name){
                        isbreak = true
                        break ;
                    }
                }
            }
            if(!isbreak){
                build_error_display(current_symbol.node, editor, diags, "Error : fact occur in premise but never in any conclusion ")
            }
        }
    }
}

/* This function performs various checks on action facts : wether they are declared ord not and if the arity is correct */ 
function check_action_fact(symbol_table : TamarinSymbolTable, editor: vscode.TextEditor, diags: vscode.Diagnostic[]){
    let actionFacts: TamarinSymbol[] = [];
    let errors : string[] = []
    for( let i = 0 ; i < symbol_table.getSymbols().length; i++){
        let current_symbol = symbol_table.getSymbol(i);
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
                build_error_display(current_symbol.node, editor, diags, "Error: this action fact is never declared")
            }
        }
        else if (current_symbol.declaration === DeclarationType.ActionF && current_symbol.context?.grammarType === 'simple_rule'){
            actionFacts.push(current_symbol)
        }
        else{
            continue;
        }
    }
    for(let symbol of symbol_table.getSymbols()){
        if(symbol.name)
        if(errors.includes(symbol.name)){
            build_error_display(symbol.node, editor, diags, " Error : incoherent arity")
        }
    }
}

/* Function to check macros, functions, facts arity and to provide
 quick fixes for wrong function name still using leverstein distance */

function check_function_macros_and_facts_arity(symbol_table : TamarinSymbolTable, editor: vscode.TextEditor, diags: vscode.Diagnostic[]){
    let known_functions : TamarinSymbol[] = [];
    let errors : string[] = []
    function getNames(list : TamarinSymbol[]): string[]{
        let str_list : string[] = [];
        for(let symbol of list){
            if(symbol.name){
                str_list.push(symbol.name);
            }
        }
        return str_list;
    }

    for( let i = 0; i < symbol_table.getSymbols().length; i++){
        let current_symbol = symbol_table.getSymbol(i);
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
                                    build_error_display(current_symbol.node, editor, diags, "Error : incorrect arity for this function, "+ known_functions[k].arity + " arguments required")                                  
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
    for(let symbol of symbol_table.getSymbols()){
        if(symbol.name)
        if(errors.includes(symbol.name)){
            build_error_display(symbol.node, editor, diags, " Error : incoherent arity")
        }
    }
    for(let symbol of known_functions){
        let isbreak = false;
        if(symbol.declaration === DeclarationType.NARY){
            for( let functionSymbol of known_functions){
                if(functionSymbol.name === symbol.name && functionSymbol !== symbol){
                    isbreak = true;
                    break;
                }
            }
            if(!isbreak){
                build_error_display(symbol.node, editor, diags, "Error : unknown function or macro");
                for(let functionSymbol of known_functions){
                    if (typeof symbol.name === 'string' && typeof functionSymbol.name === 'string'&& symbol.name !== functionSymbol.name && symbol.arity === functionSymbol.arity ) {
                        const distance = levenshteinDistance(symbol.name, functionSymbol.name);
                        if (distance < 3) { // threshold value
                            const diagnostic = build_warning_display(symbol.node, editor, diags, "Warning: did you mean " + functionSymbol.name + " ? (" + distance + "characters away)");
                            diagnostic.code = "wrongFunctionName";
                            const range = symbol.name_range;
                            const fix = new vscode.CodeAction("Replace with " + functionSymbol.name, vscode.CodeActionKind.QuickFix);
                            fix.edit = new vscode.WorkspaceEdit();
                            fix.edit.replace(editor.document.uri, range, functionSymbol.name);
                            fix.diagnostics = [diagnostic];
                            fix.isPreferred = true;
                            fixMap.set(diagnostic, fix);
                        }
                    }
                }
            }

        }
    }
}    

/* Function used to check if a term is associated to a quantified formula in a lemma */ 
function check_free_term_in_lemma(symbol_table : TamarinSymbolTable, editor: vscode.TextEditor, diags: vscode.Diagnostic[]){
    let lemma_vars : TamarinSymbol[] = [];
    for (let symbol of symbol_table.getSymbols()){
        if(symbol.declaration === DeclarationType.LemmaVariable || symbol.declaration === DeclarationType.RestrictionVariable){
            lemma_vars.push(symbol);
        }
    }
    for( let i = 0; i < lemma_vars.length; i++){
        if(lemma_vars[i].node.parent?.grammarType === DeclarationType.QF){
            set_associated_qf(lemma_vars[i], lemma_vars[i].node.parent)
            continue;
        }
        let context = lemma_vars[i].context;
        let globalisbreak = false;
        while(context?.grammarType !== 'theory'){
            let context_child_id: number[] = [];
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
                if(context?.parent){
                    context = context?.parent
                }
            }
        }
        if(!globalisbreak){
            build_warning_display(lemma_vars[i].node, editor, diags, "Warning : free term in lemma or restriction formula")
        }
    }
}

/* Function to check that a macro is not used in an equation */ 
function check_macro_not_in_equation(symbol_table : TamarinSymbolTable, editor: vscode.TextEditor, diags: vscode.Diagnostic[]){
    for(let symbol of symbol_table.getSymbols()){
        if(symbol.declaration === DeclarationType.NARY){
            for ( let macros of symbol_table.getSymbols()){
                if(macros.declaration === DeclarationType.Macro && macros.name === symbol.name && symbol.context.grammarType === DeclarationType.Equation){
                    build_error_display(symbol.node, editor, diags, "Error : a macro shoud not be used in an equation ")
                }
            }
        }
    }
}

/* Given a symbol table returns all the builtins present in it */ 
function return_builtins(symbol_table: TamarinSymbolTable): TamarinSymbol[]{
let builtins : TamarinSymbol[]  = [];
    for (let symbol of symbol_table.getSymbols()){
        if(symbol.declaration === DeclarationType.Builtin){
            builtins.push(symbol);
        }
    } 
    return builtins;
}

/* Given a list of builtins returns there name */
function get_builtins_name(builtins : TamarinSymbol[]): string[]{
    let Sbuiltins : string[] = [];
    for (let builtin of builtins ){
        if(builtin.name)
        Sbuiltins.push(builtin.name)
    }
    return Sbuiltins;
}

function return_functions(symbol_table: TamarinSymbolTable): string[]{
    let builtins : string[]  = [];
        for (let symbol of symbol_table.getSymbols()){
            if(symbol.declaration === DeclarationType.Functions && symbol.name){
                builtins.push(symbol.name);
            }
        } 
        return builtins;
    }

/* Function used to check if the use of * ^ or others symbol is allowed, if not provides a quick fix to include the right builtin,
Also works with functions defined in builtins*/ 
function check_infix_operators(symbol_table : TamarinSymbolTable, editor : vscode.TextEditor, diags : vscode.Diagnostic[], root : Parser.SyntaxNode){

    function display_infix_error(builtin: string, symbol: string, child: Parser.SyntaxNode): void {
        let current_builtins = return_builtins(symbol_table);
        let current_functions = return_functions(symbol_table)
        if (!get_builtins_name(current_builtins).includes(builtin) && !current_functions.includes(getName(child.child(0), editor))) {
            const diagnostic = build_error_display(child, editor, diags, "Error : symbol " + symbol + " cannot be used without " + builtin + " builtin");
            diagnostic.code = "missingBuiltin";
            const fix = new vscode.CodeAction("Include builtin : " + builtin, vscode.CodeActionKind.QuickFix);
            if(current_builtins.length > 0){
            const range = current_builtins[current_builtins.length - 1].name_range; 
            fix.edit = new vscode.WorkspaceEdit();
            fix.edit.insert(editor.document.uri, range.end, ", " + builtin); 
            }
            else {
                let theory = root ;
                while (theory.grammarType !== 'theory'){
                    if(theory.parent)
                    theory = theory.parent
                }
                theory = theory.child(3) as Parser.SyntaxNode
                const range = new vscode.Range(
                    editor.document.positionAt(theory.startIndex),
                    editor.document.positionAt(theory.endIndex)
                );
                fix.edit = new vscode.WorkspaceEdit();
                fix.edit.insert(editor.document.uri, range.end, "\nbuiltins :  " + builtin);
            }
            fix.diagnostics = [diagnostic];
            fix.isPreferred = true;
            fixMap.set(diagnostic, fix);     
        }
      }
      
    for (let child of root.children){
        if(child.grammarType === '^' || child.grammarType === '*'){
            let current_builtins = return_builtins(symbol_table);
            if(! get_builtins_name(current_builtins).includes('diffie-hellman')){
                display_infix_error('diffie-hellman', '^ or *', child) 
                }
        }
        else if (child.grammarType === '⊕'){
            display_infix_error('xor','⊕', child);;
        }
        else if (child.grammarType === '++'){
            display_infix_error('multiset', '++', child);;
        }
        else if (child.grammarType === '%+'){
            display_infix_error('natural-numbers', '%+', child);
        }
        else if (child.grammarType === DeclarationType.NARY){
            if(getName(child.child(0),editor) === 'inv'){
                display_infix_error('diffie-hellman', 'inv', child);
            }
            else if (getName(child.child(0),editor) === 'h'){
                display_infix_error('hashing', 'h', child);
            }
            else if (getName(child.child(0), editor) === 'sdec' || getName(child.child(0), editor) === 'senc'){
                display_infix_error('symmetric-encryption', 'sdec or senc' , child);
            }
            else if (getName(child.child(0), editor) === 'adec' || getName(child.child(0), editor) === 'aenc'){
                display_infix_error('asymmetric-encryption', 'adec or aenc' , child);
            }
            else if (getName(child.child(0), editor) === 'sign' || getName(child.child(0), editor) === 'verify'){
                display_infix_error('signing', 'sign or verify' , child);
            }
            else if (getName(child.child(0), editor) === 'revealSign' || getName(child.child(0), editor) === 'revealVerify' || getName(child.child(0), editor) === 'getMessage'){
                display_infix_error('revealing-signing', 'revealSign or revealVerify or getMessage' , child);
            }
            else if (getName(child.child(0), editor) === 'pmult' || getName(child.child(0), editor) === 'em'){
                display_infix_error('bilinear-pairing', 'pmult or em' , child);
            }
            else if (getName(child.child(0),editor) === 'XOR'){
                display_infix_error('xor', 'XOR', child);  
            }
            
        }
        else (check_infix_operators(symbol_table,editor,diags,child));
    }


}

const fixMap = new Map<vscode.Diagnostic, vscode.CodeAction>();

// Register the code action provider usefull for the quick fixes 
vscode.languages.registerCodeActionsProvider('tamarin', {
  provideCodeActions(document: vscode.TextDocument, range: vscode.Range, context: vscode.CodeActionContext, token: vscode.CancellationToken) {
    const actions: vscode.CodeAction[] = [];
    for (const diagnostic of context.diagnostics) {
      const fix = fixMap.get(diagnostic);
      if (fix) {
        actions.push(fix);
      }
    }
    return actions;
  }
});

export function checks_with_table(symbol_table : TamarinSymbolTable, editor: vscode.TextEditor, diags: vscode.Diagnostic[], root : Parser.SyntaxNode){
    check_variables_type_is_consistent_inside_a_rule(symbol_table, editor, diags);
    check_variable_is_defined_in_premise(symbol_table, editor, diags);
    check_action_fact(symbol_table, editor, diags);
    check_function_macros_and_facts_arity(symbol_table, editor, diags);
    //checkArityProblems(symbol_table,editor,diags);
    check_free_term_in_lemma(symbol_table, editor, diags);
    check_macro_not_in_equation(symbol_table, editor, diags)
    check_infix_operators(symbol_table, editor, diags, root);
    check_case_sensitivity(symbol_table, editor, diags);
};
