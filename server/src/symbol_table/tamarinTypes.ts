import * as Parser from "web-tree-sitter";
import { Range} from 'vscode-languageserver/node';

// Contains every node types used to detect symbols.
export enum DeclarationType{
    CCLVariable = 'conclusion_variable',
    PRVariable = 'premise_variable',
    ActionFVariable = 'action_fact_variable',
    LemmaVariable = 'lemma_variable',
    LMacroVariable = 'left_macro_variable',
    RMacroVariable = 'right_macro_variable',
    LEquationVariable  = 'left_equation_variable',
    REquationVariable  = 'right_equation_variable',
    RestrictionVariable = 'restriction_variable',

    Builtins = 'built_ins',
    Functions = 'functions',
    Macros = 'macros',
    Equations = 'equations',
    QF = 'quantified_formula',
    NF = 'nested_formula',
    Let  = 'let',
    Rule_let_block = "rule_let_block",
    ActionF = 'action_fact',
    Conclusion = 'conclusion',
    Premise = 'premise',

    Include = 'include',
    Lemma = 'lemma',
    Restriction = 'restriction',
    Rule = 'rule',
    Theory = 'theory',
    PubVar = 'pub_var',
    MVONF = 'msg_var_or_nullary_fun',
    TMPV = 'temporal_var',
    FUNCP = 'function_pub',
    FUNCPR = 'function_private',
    FUNCD = 'function_destructor',
    FUNCUST = 'function_custom',
    Builtin = 'built_in',
    LinearF = 'linear_fact',
    PersistentF =  'persistent_fact', 
    NARY = 'nary_app',
    DEFAULT = 'default',
    Macro = 'macro',
    Equation = 'equation'
}

export enum variable_types{
    PUB = '$',
    FRESH = '~',
    NAT = '%',
    TEMP = '#'
}


export type TamarinSymbol = {
    node : Parser.SyntaxNode
    declaration : DeclarationType
    context : Parser.SyntaxNode
    name ?:  string 
    name_range : Range
    arity ?: number
    type ?: string
    associated_qf ?: Parser.SyntaxNode
};