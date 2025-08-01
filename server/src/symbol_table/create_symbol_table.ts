import { TextDocument } from "vscode-languageserver-textdocument";
import * as Parser from "web-tree-sitter";
import { Range} from 'vscode-languageserver/node';
import { check_reserved_facts} from '../features/checks/checkReservedFacts';
import {getName} from '../features/checks/utils'
import { Diagnostic } from "vscode-languageserver-types";
import { ReservedFacts, ExistingBuiltIns , AssociatedFunctions} from "./tamarinConstants";
import { DeclarationType, TamarinSymbol} from "./tamarinTypes";
import { find_variables, find_narry , find_linear_fact,get_arity,get_macro_arity,get_range } from "./utils";

export type CreateSymbolTableResult = {
    symbolTable: TamarinSymbolTable
};


/* Function used to register the symbol table for each file */ 

export const createSymbolTable = async (root: Parser.SyntaxNode, document: TextDocument): Promise<{ symbolTable: TamarinSymbolTable, diags: Diagnostic[] }> => {
    const diags: Diagnostic[] = []; 
    const symbolTableVisitor = new SymbolTableVisitor();
    const symbolTable =  await  symbolTableVisitor.visit(root, document, diags);
    symbolTable.setRootNodedocumentDiags(root);
    convert_linear_facts(symbolTable);
    return {symbolTable,diags};
};

/* Given the tree structure persistent facts are just linear facts with a ! as left sibling 
function used to set the right type */
function convert_linear_facts(ts : TamarinSymbolTable){
    for (const symbol of ts.getSymbols()){
        if(symbol.declaration === DeclarationType.LinearF && symbol.node.previousSibling?.grammarType === "!"){
            symbol.declaration = DeclarationType.PersistentF;
            
        }
    }
}

function visit_include(node: Parser.SyntaxNode, symbolTable: TamarinSymbolTable) {
    const match = node.text.match(/#include\s+"([^"]+)"/);
    if (match && match[1]) {
        symbolTable.addInclude(match[1]);
    }
}

function convert(grammar_type : string) : DeclarationType{
    if(grammar_type === 'nary_app'){return DeclarationType.NARY}
    else if(grammar_type === 'linear_fact'){return DeclarationType.LinearF}
    else{return DeclarationType.DEFAULT}
}

class SymbolTableVisitor{
    constructor(
    private readonly symbolTable : TamarinSymbolTable = new TamarinSymbolTable() ,
    private context: undefined | Parser.Tree = undefined){
        this.context = context
    }
    private visitcounter : number = 0; // Used to add fst snd and pair symbols only once
    protected defaultResult(): TamarinSymbolTable {
        return this.symbolTable;
    }
    /* Method that builds the symbol table adding every symbols while visiting the AST*/
    public async visit(root : Parser.SyntaxNode, document: TextDocument, diags: Diagnostic[]): Promise<TamarinSymbolTable>{
        //Include default functions but the neither the nodes or the name range are correct
        if(this.visitcounter === 0){
            this.visitcounter ++ ;
            for (let k = 0 ; k < AssociatedFunctions[AssociatedFunctions.length - 1].length; k += 2){
                this.registerfucntion(root, DeclarationType.Functions, AssociatedFunctions[AssociatedFunctions.length - 1][k], parseInt(AssociatedFunctions[AssociatedFunctions.length - 1][k+1]), root, get_range(root));
            }
        }

        for (let i = 0; i < root.children.length; i++){
            const child = root.child(i);

            if (!child) {continue;}

            if((child?.grammarType === DeclarationType.Lemma && (root.grammarType === 'lemma'|| root.grammarType === 'diff_lemma') && root.parent !== null && child?.nextSibling)){
                this.registerident(root, DeclarationType.Lemma, getName(child?.nextSibling, document), root.parent ,get_range(child?.nextSibling))
                this.register_facts_searched(root, document, root, DeclarationType.ActionF);
                this.register_vars_lemma(root, DeclarationType.LemmaVariable, document)
            }
            else if (child?.grammarType === DeclarationType.Include){
                visit_include(root, this.symbolTable);
            }
            else if (child?.grammarType === DeclarationType.Restriction && root.grammarType === 'restriction' && root.parent !== null && child?.nextSibling){
                this.registerident(root, DeclarationType.Restriction, getName(child?.nextSibling, document), root.parent ,get_range(child?.nextSibling))
                this.register_facts_searched(root, document, root);
                this.register_vars_lemma(root, DeclarationType.RestrictionVariable, document)
            }
            else if (child?.grammarType === DeclarationType.Rule && root.grammarType === 'simple_rule' && root.parent !== null && child?.nextSibling){
                this.registerident(root, DeclarationType.Rule, getName(child.nextSibling, document), root.parent, get_range(child.nextSibling))
                diags.push(...check_reserved_facts(root, document));
            }
            else if (child?.grammarType === DeclarationType.QF){
               continue;
            }
            else if(child?.grammarType === DeclarationType.NF){
                continue;
            }
            else if(child?.grammarType === DeclarationType.Functions ){
                for (const grandchild of child.children){
                    if(grandchild.grammarType === DeclarationType.FUNCP || grandchild.grammarType === DeclarationType.FUNCPR || grandchild.grammarType === DeclarationType.FUNCD || grandchild.grammarType === DeclarationType.FUNCUST){
                        const funcNameNode = grandchild.child(0);
                        if (funcNameNode) {
                            this.registerfucntion(grandchild, DeclarationType.Functions, getName(grandchild.child(0),document), parseInt(getName(grandchild.child(2),document)), root, get_range(funcNameNode));
                        }
                    }
                    else if(grandchild.grammarType === 'function_untyped' && grandchild.child(0) !== null) {
                        const funcName = getName(grandchild.child(0), document);
                        const arity = parseInt(getName(grandchild.child(2), document));
                        const funcNode = grandchild.child(0);
                        if (funcNode) {
                            this.registerfucntion(grandchild, DeclarationType.Functions, funcName, arity, root, get_range(funcNode));
                        }
                    }
                }
            }
            else if( child?.grammarType === DeclarationType.Macros || child?.grammarType === DeclarationType.Equations){
                for(const grandchild of child.children){
                    if(grandchild.grammarType === DeclarationType.Macro){
                        const macroNameNode = grandchild.child(0);
                        if (macroNameNode) {
                            this.registerfucntion(grandchild, DeclarationType.Macro, getName(macroNameNode, document), get_macro_arity(grandchild.children), root, get_range(macroNameNode));
                        }
                        this.register_facts_searched(grandchild, document, grandchild, DeclarationType.NARY)
                        let eqcount = 0  ;                
                        for(const ggchild of grandchild.children){
                            if(ggchild.grammarType === "="){
                                eqcount ++ ;
                            }
                            if(eqcount === 0){
                                this.register_vars_left_macro_part(ggchild, DeclarationType.LMacroVariable, document, grandchild);
                            }
                            else{
                                this.register_vars_rule(ggchild, DeclarationType.RMacroVariable, document, grandchild);
                    
                            }
                        }
                    }
                    else if (grandchild.grammarType === DeclarationType.Equation){ 
                        diags.push(...check_reserved_facts(grandchild, document))
                        this.register_facts_searched(grandchild, document, grandchild, DeclarationType.NARY);   
                        let eqcount = 0  ;                
                        for(const ggchild of grandchild.children){
                            if(ggchild.grammarType === "="){
                                eqcount ++ ;
                                continue;
                            }
                            if(eqcount === 0){
                                this.register_vars_rule(ggchild, DeclarationType.LEquationVariable, document, grandchild);
                            }
                            else{
                                this.register_vars_rule(ggchild, DeclarationType.REquationVariable, document, grandchild);

                            }
                            
                        }
                    }

                }
            }
            else if (child?.grammarType === DeclarationType.Builtins){
                let pkcount = 0;
                for (const grandchild of child.children){
                    if(grandchild.grammarType === DeclarationType.Builtin && grandchild.child(0) !== null){
                        const builtinType = grandchild.child(0)?.grammarType ?? '';
                        this.registerident(grandchild, DeclarationType.Builtin, builtinType, root, get_range(grandchild));
                        const built_in_index = ExistingBuiltIns.indexOf(builtinType);
                        if(built_in_index >= 0 && AssociatedFunctions[built_in_index]){
                            for (let k = 0 ; k < AssociatedFunctions[built_in_index].length; k += 2){
                                if(AssociatedFunctions[built_in_index][k] === 'pk' && pkcount > 1){
                                    break;
                                }
                                this.registerfucntion(grandchild, DeclarationType.Functions, AssociatedFunctions[built_in_index][k], parseInt(AssociatedFunctions[built_in_index][k+1]), root, get_range(grandchild));
                            }
                        }
                        if(builtinType === 'asymmetric-encryption'|| builtinType ==='signing'|| builtinType ==='revealing-signing'){ pkcount ++ }
                    }
                    
                }
            }
            else if(child?.grammarType === DeclarationType.ActionF){
                for (const grandchild of child.children){
                    if(grandchild.grammarType === DeclarationType.LinearF && grandchild.child(2) !== null ){
                        const args = grandchild.child(2)?.children;
                        if(args){
                            const arity: number = get_arity(args)
                        const node = grandchild.child(0);
                        if(node){
                            this.registerfucntion(grandchild, DeclarationType.ActionF, getName(grandchild.child(0), document), arity, root, get_range(node))
                        }
                    }
                    }
                }
                this.register_narry(child, document, root)
                this.register_vars_rule(child, DeclarationType.ActionFVariable, document, root)        
            }
            else if(child?.grammarType === DeclarationType.Conclusion){
                this.register_facts_searched(child, document, root);
                this.register_vars_rule(child, DeclarationType.CCLVariable, document, root)
            }
            else if (child?.grammarType === DeclarationType.Premise){
                this.register_facts_searched(child, document, root);
                this.register_vars_rule(child, DeclarationType.PRVariable, document, root);
            }
            else if( child?.grammarType === DeclarationType.Rule_let_block){
                this.register_vars_rule(child, DeclarationType.PRVariable, document, root)
            }
            else{
                if(child !== null){
                    await this.visit(child, document, diags);
                }
            }
        }
        return this.symbolTable
    }
    //Method used to register vars found by find variables function 
    private register_vars_rule(node :Parser.SyntaxNode, type : DeclarationType, document : TextDocument, root : Parser.SyntaxNode){
        const vars: Parser.SyntaxNode[] = find_variables(node);
                for(let k = 0; k < vars.length; k++){
                    if(vars[k].grammarType === DeclarationType.MVONF){
                        let isregistered = false
                        for(const symbol of this.symbolTable.getSymbols()){
                            if(symbol.declaration === DeclarationType.Functions){
                                if(symbol.name === getName(vars[k], document)){
                                    isregistered = true;
                                    this.registerfucntion(vars[k], DeclarationType.NARY, symbol.name,0,root, get_range(vars[k]) )
                                }
                            }
                            else {continue;}
                        }
                        const nameNode = vars[k].child(0);
                        if(! isregistered && nameNode){
                            this.registerident(vars[k], type, getName(vars[k].child(0), document),root, get_range(nameNode))
                        }
                    }
                    else{
                        const nameNode = vars[k].child(1);
                        if(nameNode){
                            this.registerident(vars[k], type, getName(vars[k].child(1), document),root, get_range(nameNode), vars[k].child(0)?.grammarType)
                        }
                    }
                }
    }


    private register_vars_left_macro_part(node :Parser.SyntaxNode, type : DeclarationType, document : TextDocument, root : Parser.SyntaxNode){
        if(node.grammarType === DeclarationType.MVONF){
            let isregistered = false
                        for(const symbol of this.symbolTable.getSymbols()){
                            if(symbol.declaration === DeclarationType.Functions){
                                if(symbol.name === getName(node, document)){
                                    isregistered = true;
                                    this.registerfucntion(node, DeclarationType.NARY, symbol.name,0,root, get_range(node) )
                                }
                            }
                            else {continue;}
                        }
                        if(! isregistered){
                            const nameNode = node.child(0);
                            if(nameNode){
                                this.registerident(node, type, getName(node.child(0), document),root, get_range(nameNode))
                            }
                        }
        }
        else if (node.grammarType === 'pub_var' ||node.grammarType === 'fresh_var' || node.grammarType === 'nat_var'|| node.grammarType === 'temporal_var'){
            const nameNode = node.child(1);
            if(nameNode){
                this.registerident(node, type, getName(node.child(1), document),root, get_range(nameNode), node.child(0)?.grammarType)
            }
        }
    }

    private register_vars_lemma(node :Parser.SyntaxNode, type : DeclarationType, document : TextDocument){
        const vars: Parser.SyntaxNode[] = find_variables(node);
        for(let k = 0; k < vars.length; k++){
            let context: Parser.SyntaxNode = vars[k];
            while(context.grammarType !== DeclarationType.NF && 
                context.grammarType !== 'conjunction' && 
                context.grammarType !== 'disjunction' && 
                context.grammarType !== DeclarationType.Lemma && 
                context.grammarType !== DeclarationType.Restriction && 
                context.grammarType !== 'diff_lemma' &&
                context.grammarType !== 'term_eq' && //node used in equalities
                context.grammarType !== 'temp_var_eq' //node used in equalities between temporal variables
                ){
                if(context.parent){
                    context = context.parent;
                }
            }
            if(vars[k].parent !== null){
                if(vars[k].grammarType === DeclarationType.MVONF ||  (vars[k].grammarType === DeclarationType.TMPV  && vars[k].children.length === 1)){
                    let isregistered = false
                    for(const symbol of this.symbolTable.getSymbols()){
                        if(symbol.declaration === DeclarationType.Functions){
                            if(symbol.name === getName(vars[k], document)){
                                isregistered = true;
                                this.registerfucntion(vars[k], DeclarationType.NARY, symbol.name,0,context, get_range(vars[k]) )
                            }
                        }
                        else {continue;}
                    }
                    if(! isregistered){
                        const nameNode = vars[k].child(0);
                        if(nameNode){
                            this.registerident(vars[k], type, getName(vars[k].child(0), document),context, get_range(nameNode))
                        }
                    }
                }
                else{
                    const nameNode = vars[k].child(1);
                    if(nameNode){
                        this.registerident(vars[k], type, getName(vars[k].child(1), document),context,get_range(nameNode) ,  vars[k].child(0)?.grammarType)
                    }
                }
            }
        }
    }

    /* Function used to register the facts found with find_linear_fact*/
    private register_facts_searched(node :Parser.SyntaxNode, document : TextDocument, root : Parser.SyntaxNode, type ?: DeclarationType){
        const vars: Parser.SyntaxNode[] = find_linear_fact(node);
        for(let k = 0; k < vars.length; k++){
            const factName = getName(vars[k].child(0), document);
            if(ReservedFacts.includes(factName)){
                continue;
            }
            let isFunction = false;
            for(const symbol of this.symbolTable.getSymbols()) {
                if(symbol.declaration === DeclarationType.Functions && symbol.name === factName) {
                    isFunction = true;
                    if(vars[k].child(2) !== null){
                        const args = vars[k].child(2)?.children;
                        if(args){
                            const arity: number = get_arity(args);
                            const factNameNode = vars[k].child(0);
                            if(factNameNode){
                                this.registerfucntion(vars[k], DeclarationType.NARY, factName, arity, root, get_range(factNameNode));
                            }
                        }
                    }
                    break;
                }
            }
            if(isFunction) {
                continue; 
            }
            if(vars[k].child(2) !== null){
                const args = vars[k].child(2)?.children;
                if(args){
                    const arity: number = get_arity(args);
                    const factNameNode = vars[k].child(0);
                    if(factNameNode){
                    if(type){
                            this.registerfucntion(vars[k], type, factName, arity, root, get_range(factNameNode));
                        }
                        else{
                            this.registerfucntion(vars[k], convert(vars[k].grammarType), factName, arity, root, get_range(factNameNode));
                        }
                    }
                }
            }
        }
    }

    /* Same as above but for functions */
    private register_narry(node :Parser.SyntaxNode, document : TextDocument, root : Parser.SyntaxNode){
        const vars: Parser.SyntaxNode[] = find_narry(node);
        for(let k = 0; k < vars.length; k++){
            if(ReservedFacts.includes(getName(vars[k].child(0),document))){
                continue;
            }
            const nodeName = vars[k].child(0);
            if(nodeName){
                if(node.child(2) !== null){
                    const args = vars[k].child(2)?.children;
                    if(args){
                        const arity: number = get_arity(args);
                        this.registerfucntion(vars[k], convert(vars[k].grammarType) , getName(vars[k].child(0),document),arity, root, get_range(nodeName));
                    }
                }
                else{
                    this.registerfucntion(vars[k], convert(vars[k].grammarType) , getName(vars[k].child(0),document),0, root, get_range(nodeName))

                }
            }
        }
    }


    /* Same as above but for identifiers */
    private registerident(ident : Parser.SyntaxNode|null|undefined, declaration: DeclarationType, name : string|undefined,  context : Parser.SyntaxNode, range : Range, type ?: string ){
        if(!ident){
            return;
        }
        this.symbolTable.addSymbol({
            node : ident,
            declaration:  declaration,
            name : name,
            context : context,
            type : type, 
            name_range : range,
        });

    }

    private registerfucntion(ident : Parser.SyntaxNode|null|undefined, declaration: DeclarationType, name : string, arity : number,  context : Parser.SyntaxNode , range : Range){
        if(!ident){
            return;
        }
        this.symbolTable.addSymbol({
            node : ident,
            declaration:  declaration,
            name : name,
            arity : arity,
            context : context,
            name_range : range
        });

    }

    
}




export function set_associated_qf(symbol : TamarinSymbol, node : Parser.SyntaxNode |null):void {
    if(node){
        symbol.associated_qf = node;
    }
}

export class TamarinSymbolTable{
    private symbols : TamarinSymbol[] = [];
    private includes: string[] = [];
    private root_node!: Parser.SyntaxNode;
    public addInclude(includePath: string): void {
        this.includes.push(includePath);
    }
    public getIncludes(): string[] {
        return this.includes;
    }
    public addSymbol(symbol: TamarinSymbol) {
        this.symbols.push(symbol);
    }

    public getSymbols(): TamarinSymbol[] {
        return this.symbols;
    }

    public setSymbols(symbols : TamarinSymbol[]): void{
        this.symbols = symbols;
    }

    public getSymbol(int : number):TamarinSymbol{
        return this.symbols[int];
    }

    public setRootNodedocumentDiags(root : Parser.SyntaxNode): void{
        this.root_node = root;
    }

    public unshift(symbol: TamarinSymbol): void {
        this.symbols.unshift(symbol);
    }

    public findSymbolByName(name: string): TamarinSymbol | undefined {
        const primaryDeclarations = [
            DeclarationType.Functions, 
            DeclarationType.Rule, 
            DeclarationType.Lemma, 
            DeclarationType.Restriction, 
            DeclarationType.Macro
        ];
        const symbol = this.symbols.find(s => 
            s.name === name && primaryDeclarations.includes(s.declaration)
        );
        if (symbol) {
            return symbol;
        }
        return this.symbols.find(s => s.name === name);
    }

}
