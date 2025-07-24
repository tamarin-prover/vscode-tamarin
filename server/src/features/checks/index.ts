import * as Parser from "web-tree-sitter";
import { TamarinSymbolTable } from '../../symbol_table/create_symbol_table';
import { TextDocument } from "vscode-languageserver-textdocument";
import { Diagnostic } from 'vscode-languageserver';
import { check_variables_type_is_consistent_inside_a_rule } from './checkVariableTypes';
import { check_variable_is_defined_in_premise } from './checkVariableScope';
import { check_action_fact } from './checkActionFacts';
import { check_function_macros_and_facts_arity } from './checkArity';
import { check_free_term_in_lemma } from './checkFreeTerms';
import { check_macro_not_in_equation } from './checkMacrosInEquations';
import { check_infix_operators } from './checkInfixOperators';
import { check_case_sensitivity } from './checkSpelling';
import { check_equality_types} from './checkEqualityTypes'


export function checks_with_table(symbol_table : TamarinSymbolTable, document: TextDocument, root : Parser.SyntaxNode): Diagnostic[]{
    const typeErrors = check_variables_type_is_consistent_inside_a_rule(symbol_table, document);
    const premiseErrors = check_variable_is_defined_in_premise(symbol_table, document);
    const actionFactErrors = check_action_fact(symbol_table, document);
    const arityErrors = check_function_macros_and_facts_arity(symbol_table, document);
    const freeTermWarnings = check_free_term_in_lemma(symbol_table, document);
    const macroInEquationErrors = check_macro_not_in_equation(symbol_table, document);
    const infixOperatorErrors = check_infix_operators(symbol_table, document, root);
    const spellingWarnings = check_case_sensitivity(symbol_table, document);
    const equalityErrors = check_equality_types(symbol_table,document);
    const allDiagnostics = [
        ...typeErrors,
        ...premiseErrors,
        ...actionFactErrors,
        ...arityErrors,
        ...freeTermWarnings,
        ...macroInEquationErrors,
        ...infixOperatorErrors,
        ...spellingWarnings,
        ...equalityErrors
    ];
    return allDiagnostics;
}
