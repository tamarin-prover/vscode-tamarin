import { DeclarationType} from "./tamarinTypes";
import * as  Parser from "web-tree-sitter";
import { Range, Position } from 'vscode-languageserver/node';


/* Function used to find all variables given a  tree node it will search through all sons,
used to find lemma or rule vars for example  */ 
export function find_variables(node : Parser.SyntaxNode): Parser.SyntaxNode[]{
    let vars : Parser.SyntaxNode[] = []
    if( node.grammarType === DeclarationType.MVONF && node.parent?.grammarType === DeclarationType.Equation){
        vars.push(node)
        return vars
    }
       
    for( const child of node.children){

         //This is used to skip errors in proof methods modify it if you want to manage proof methods
         if(child.grammarType === "proof_method"){
            continue;
        }

        if(child.grammarType === 'pub_var' ||child.grammarType === 'fresh_var' || child.grammarType === DeclarationType.MVONF ||child.grammarType === 'nat_var'|| child.grammarType === 'temporal_var'){
            vars.push(child)
            vars = vars.concat(find_variables(child));
        }
        else{
            vars = vars.concat(find_variables(child));
        }
    }  
    return vars;  
}

/* Same as the above function but for facts or functions*/
export function find_linear_fact(node : Parser.SyntaxNode): Parser.SyntaxNode[]{
    let vars : Parser.SyntaxNode[] = []
    for( const child of node.children){

        //This is used to skip errors in proof methods modify it if you want to manage proof methods
        if(child.grammarType === "proof_method"){
            continue;
        }
        
        if(child.grammarType === DeclarationType.LinearF || child.grammarType === DeclarationType.NARY || child.grammarType === DeclarationType.PersistentF){
            vars.push(child)
            vars = vars.concat(find_linear_fact(child));
        }
        else{
            vars = vars.concat(find_linear_fact(child));
        }
    }  
    return vars;  
}

export function find_narry(node : Parser.SyntaxNode): Parser.SyntaxNode[]{
    let vars : Parser.SyntaxNode[] = []
    for( const child of node.children){
        if(child.grammarType === DeclarationType.NARY){
            vars.push(child)
            vars = vars.concat(find_linear_fact(child));
        }
        else{
            vars = vars.concat(find_linear_fact(child));
        }
    }  
    return vars;  
}

/* Given a function or fact node returns his arity*/
export function get_arity(node : Parser.SyntaxNode[]|undefined): number{
    let arity: number = 0;
    if(node)
    for (const arg of node){
        if(arg.type !== ","){
            arity ++;
        }
    } 
    return arity;
}

/* Same as above but for macros */
export function get_macro_arity(node : Parser.SyntaxNode[]|undefined): number{
    let arity: number = -1;
    if(node)
    for (const arg of node){
        if(arg.type === "="){
            break
        }
        if(arg.type !== "," && arg.type !== "(" && arg.type !== ")" ){
            arity ++;
        }
    } 
    return arity;
}
export function get_range(node: Parser.SyntaxNode): Range {
    const startPosition: Position = {
        line: node.startPosition.row,
        character: node.startPosition.column
    };
    
    const endPosition: Position = {
        line: node.endPosition.row,
        character: node.endPosition.column
    };

    return { start: startPosition, end: endPosition };
}