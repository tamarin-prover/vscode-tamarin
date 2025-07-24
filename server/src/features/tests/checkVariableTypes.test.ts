import { TextDocument } from 'vscode-languageserver-textdocument';
import {TamarinSymbol } from '../../symbol_table/tamarinTypes'; 
import { DeclarationType } from '../../symbol_table/tamarinTypes'; 
import {check_variables_type_is_consistent_inside_a_rule} from '../checks/checkVariableTypes'
import { createMockSymbol, createMockSymbolTable} from './utils';
import * as Parser from "web-tree-sitter";


const mockDocument = TextDocument.create('file:///test.spthy', 'tamarin', 1, '');

describe('checkVariableTypes', () => {
        it('Should return no errors for coherent variables types', () => {
            // SCÉNARIO : Rule `[ F($x) ] --> [ G($x) ]`
            const sharedRuleContext = { 
                id: 1, 
                grammarType: 'rule' ,
                tree: {} as Parser.Tree,
                startIndex: 0,
                endIndex: 10,
                startPosition: { row: 0, column: 0 },
                endPosition: { row: 0, column: 10 },
            } as Parser.SyntaxNode;
            const symbols: TamarinSymbol[] = [
                createMockSymbol({
                    name: 'x',
                    declaration: DeclarationType.PRVariable,
                    context: sharedRuleContext,
                    type: '~'
                }),
                createMockSymbol({
                    name: 'x',
                    declaration: DeclarationType.CCLVariable,
                    context: sharedRuleContext,
                    type: '~'
                }),
            ];
            const symbolTable = createMockSymbolTable(symbols);
            const diagnostics = check_variables_type_is_consistent_inside_a_rule(symbolTable, mockDocument);
            expect(diagnostics).toHaveLength(0);
        });

        it('Should return an error for rule variables with inconsistent types', () => {
            // SCÉNARIO : Rule `[ F($x) ] --> [ G(~x) ]`
            const sharedRuleContext = { 
                id: 1, 
                grammarType: 'rule' ,
                tree: {} as Parser.Tree,
                startIndex: 0,
                endIndex: 10,
                startPosition: { row: 0, column: 0 },
                endPosition: { row: 0, column: 10 },
            } as Parser.SyntaxNode;
            const symbols: TamarinSymbol[] = [
                createMockSymbol({
                    name: 'x',
                    declaration: DeclarationType.PRVariable,
                    context: sharedRuleContext,
                    type: '$'
                }),
                createMockSymbol({
                    name: 'x',
                    declaration: DeclarationType.CCLVariable,
                    context: sharedRuleContext,
                    type: '~'
                }),
            ];
            const symbolTable = createMockSymbolTable(symbols);
            const diagnostics = check_variables_type_is_consistent_inside_a_rule(symbolTable, mockDocument);
            expect(diagnostics).toHaveLength(2);
            expect(diagnostics[0].message).toContain("Error: inconsistent variables, variables with the same name in the same rule must have same types");
        });

        it('Should not confuse variables with the same name in different rules', () => {
            // SCÉNARIO : Rule A with $x and Rule B with ~x
            const RuleContext1 = { 
                id: 1, 
                grammarType: 'rule' ,
                tree: {} as Parser.Tree,
                startIndex: 0,
                endIndex: 10,
                startPosition: { row: 0, column: 0 },
                endPosition: { row: 0, column: 10 },
            } as Parser.SyntaxNode;
            const RuleContext2 = { 
                id: 2, 
                grammarType: 'rule' ,
                tree: {} as Parser.Tree,
                startIndex: 11,
                endIndex: 20,
                startPosition: { row: 1, column: 0 },
                endPosition: { row: 1, column: 10 },
            } as Parser.SyntaxNode;
            const symbols: TamarinSymbol[] = [
                createMockSymbol({
                    name: 'x',
                    declaration: DeclarationType.PRVariable,
                    type: '$',
                    context: RuleContext1
                }),
                createMockSymbol({
                    name: 'x',
                    declaration: DeclarationType.CCLVariable,
                    type: '~',
                    context: RuleContext2
                }),
            ];
            const symbolTable = createMockSymbolTable(symbols);
            const diagnostics = check_variables_type_is_consistent_inside_a_rule(symbolTable, mockDocument);
            expect(diagnostics).toHaveLength(0);
        });

        it('Should return no errors for a well-formed equation', () => {
            // SCÉNARIO : `Equation f(x) = g(x)'
            const sharedEquationContext = { 
                id: 1, 
                grammarType: 'equation' ,
                tree: {} as Parser.Tree,
                startIndex: 0,
                endIndex: 10,
                startPosition: { row: 0, column: 0 },
                endPosition: { row: 0, column: 10 },
            } as Parser.SyntaxNode;
            const symbols: TamarinSymbol[] = [
                createMockSymbol({
                    name: 'x',
                    declaration: DeclarationType.LEquationVariable,
                    context: sharedEquationContext
                }),
                createMockSymbol({
                    name: 'x',
                    declaration: DeclarationType.REquationVariable,
                    context: sharedEquationContext
                }),
            ];
            const symbolTable = createMockSymbolTable(symbols);
            const diagnostics = check_variables_type_is_consistent_inside_a_rule(symbolTable, mockDocument);
            expect(diagnostics).toHaveLength(0);
        });

        it('Should return an error if a variable on the right side of the equation does not exist on the left side', () => {
            // SCÉNARIO : `Equation f() = g(x)'
            const sharedEquationContext = { 
                id: 1, 
                grammarType: 'equation' ,
                tree: {} as Parser.Tree,
                startIndex: 0,
                endIndex: 10,
                startPosition: { row: 0, column: 0 },
                endPosition: { row: 0, column: 10 },
            } as Parser.SyntaxNode;
            const symbols: TamarinSymbol[] = [
                createMockSymbol({
                    name: 'x',
                    declaration: DeclarationType.REquationVariable,
                    context: sharedEquationContext
                }),
            ];
            const symbolTable = createMockSymbolTable(symbols);
            const diagnostics = check_variables_type_is_consistent_inside_a_rule(symbolTable, mockDocument);
            expect(diagnostics).toHaveLength(1);
            expect(diagnostics[0].message).toContain("doesn't exist on the left side");
        });

        it('Should return no errors for a well-formed macro', () => {
            // SCÉNARIO : 'Macro my_macro(x) = something(x)'
            const sharedMacroContext = { 
                id: 1, 
                grammarType: 'macro' ,
                tree: {} as Parser.Tree,
                startIndex: 0,
                endIndex: 10,
                startPosition: { row: 0, column: 0 },
                endPosition: { row: 0, column: 10 },
            } as Parser.SyntaxNode;
            const symbols: TamarinSymbol[] = [
                createMockSymbol({
                    name: 'x',
                    declaration: DeclarationType.LMacroVariable,
                    context: sharedMacroContext
                }),
                createMockSymbol({
                    name: 'x',
                    declaration: DeclarationType.RMacroVariable,
                    context: sharedMacroContext
                }),
            ];
            const symbolTable = createMockSymbolTable(symbols);
            const diagnostics = check_variables_type_is_consistent_inside_a_rule(symbolTable, mockDocument);
            expect(diagnostics).toHaveLength(0);
        });
        
        it('Should return an error if a variable on the right side of the macro does not exist on the left side', () => {
            // SCÉNARIO : 'Macro my_macro() = something(x)'
            const sharedMacroContext = { 
                id: 1, 
                grammarType: 'macro' ,
                tree: {} as Parser.Tree,
                startIndex: 0,
                endIndex: 10,
                startPosition: { row: 0, column: 0 },
                endPosition: { row: 0, column: 10 },
            } as Parser.SyntaxNode;
            const symbols: TamarinSymbol[] = [
                createMockSymbol({
                    name: 'x',
                    declaration: DeclarationType.RMacroVariable,
                    context: sharedMacroContext
                }),
            ];
            const symbolTable = createMockSymbolTable(symbols);
            const diagnostics = check_variables_type_is_consistent_inside_a_rule(symbolTable, mockDocument);
            expect(diagnostics).toHaveLength(1);
            expect(diagnostics[0].message).toContain("doesn't exist on the left side");
        });

        it('Should ignore public variables to the right of a macro', () => {
            // SCÉNARIO : 'Macro my_macro() = something(~x)'
            const sharedMacroContext = { 
                id: 1, 
                grammarType: 'macro' ,
                tree: {} as Parser.Tree,
                startIndex: 0,
                endIndex: 10,
                startPosition: { row: 0, column: 0 },
                endPosition: { row: 0, column: 10 },
            } as Parser.SyntaxNode;
            const symbols: TamarinSymbol[] = [
                createMockSymbol({
                    name: 'x',
                    declaration: DeclarationType.RMacroVariable,
                    context: sharedMacroContext,
                    type: '$'
                }),
            ];
            const symbolTable = createMockSymbolTable(symbols);
            const diagnostics = check_variables_type_is_consistent_inside_a_rule(symbolTable, mockDocument);
            expect(diagnostics).toHaveLength(0);
        });
});