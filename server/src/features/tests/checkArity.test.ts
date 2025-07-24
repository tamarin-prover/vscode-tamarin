import { TextDocument } from 'vscode-languageserver-textdocument';
import {TamarinSymbol } from '../../symbol_table/tamarinTypes'; 
import { DeclarationType } from '../../symbol_table/tamarinTypes'; 
import {check_function_macros_and_facts_arity} from '../checks/checkArity'
import { createMockSymbol, createMockSymbolTable , } from './utils';


const mockDocument = TextDocument.create('file:///test.spthy', 'tamarin', 1, '');

describe('checkArity', () => {
    it('Should return an error if a function is called with the wrong arity', () => {
        const symbols: TamarinSymbol[] = [
            createMockSymbol({
                name: 'MyFun',
                declaration: DeclarationType.Functions,
                arity: 2
            }),
            createMockSymbol({
                name: 'MyFun',
                declaration: DeclarationType.NARY,
                arity: 1
            })
        ];
        const symbolTable = createMockSymbolTable(symbols);
        const diagnostics = check_function_macros_and_facts_arity(symbolTable, mockDocument);
        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0].message).toContain("Error : incorrect arity for this function, 2 arguments required");
    });

    it('Should not return an error if a function is called with the correct arity', () => {
        const symbols: TamarinSymbol[] = [
            createMockSymbol({
                name: 'MyFun',
                declaration: DeclarationType.Functions,
                arity: 2
            }),
            createMockSymbol({
                name: 'MyFun',
                declaration: DeclarationType.NARY,
                arity: 2
            })
        ];
        const symbolTable = createMockSymbolTable(symbols);
        const diagnostics = check_function_macros_and_facts_arity(symbolTable, mockDocument);
        expect(diagnostics).toHaveLength(0);
    });

    it('Should ignore arity checking if the usage has arity zero', () => {
        const symbols: TamarinSymbol[] = [
            createMockSymbol({
                name: 'MyFun',
                declaration: DeclarationType.Functions,
                arity: 2
            }),
            createMockSymbol({
                name: 'MyFun',
                declaration: DeclarationType.NARY,
                arity: 0
            })
        ];
        const symbolTable = createMockSymbolTable(symbols);
        const diagnostics = check_function_macros_and_facts_arity(symbolTable, mockDocument);
        expect(diagnostics).toHaveLength(0);
    });

    it('Should return an error for a function used but never declared', () => {
        const symbols: TamarinSymbol[] = [
            createMockSymbol({
                name: 'MyFun',
                declaration: DeclarationType.NARY,
                arity: 0
            })
        ];
        const symbolTable = createMockSymbolTable(symbols);
        const diagnostics = check_function_macros_and_facts_arity(symbolTable, mockDocument);
        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0].message).toContain("Error : unknown function or macro");
    });

    it('Should suggest a fix for an unknown function with a typo', () => {
        const symbols: TamarinSymbol[] = [
            createMockSymbol({
                name: 'MyFun',
                declaration: DeclarationType.Functions,
                arity: 1
            }),
            createMockSymbol({
                name: 'MyFune',
                declaration: DeclarationType.NARY,
                arity: 1
            })
        ];
        const symbolTable = createMockSymbolTable(symbols);
        const diagnostics = check_function_macros_and_facts_arity(symbolTable, mockDocument);
        expect(diagnostics).toHaveLength(2);
        expect(diagnostics[1].message).toContain("Warning: did you mean MyFun ? (1 characters away)");
    });
});


