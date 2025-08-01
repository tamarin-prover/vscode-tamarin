import { TextDocument } from 'vscode-languageserver-textdocument';
import {TamarinSymbol } from '../../symbol_table/tamarinTypes'; 
import { DeclarationType } from '../../symbol_table/tamarinTypes'; 
import {check_function_macros_and_facts_arity} from '../checks/checkArity'
import { createMockSymbol, createMockSymbolTable , } from './utils';
import {TamarinSymbolTable} from "../../symbol_table/create_symbol_table";

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
        const libTable = createMockSymbolTable([]);
        const allSymbolTables = new Map<string, TamarinSymbolTable>([
        ['file:///lib.spthy', libTable],
        ['file:///current.spthy', symbolTable]
        ]);
        const diagnostics = check_function_macros_and_facts_arity(symbolTable, mockDocument,allSymbolTables);
        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0].message).toContain("Error: incorrect arity for 'MyFun'. Expected 2, but got 1.");
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
        const libTable = createMockSymbolTable([]);
        const allSymbolTables = new Map<string, TamarinSymbolTable>([
        ['file:///lib.spthy', libTable],
        ['file:///current.spthy', symbolTable]
        ]);
        const diagnostics = check_function_macros_and_facts_arity(symbolTable, mockDocument,allSymbolTables);
        expect(diagnostics).toHaveLength(0);
    });

    it('Should not return an error if a function is called with the correct arity and declared in another file that is included', () => {
        const symbols: TamarinSymbol[] = [
            createMockSymbol({
                name: 'MyFun',
                declaration: DeclarationType.NARY,
                arity: 2
            })
        ];
        const symbolTable = createMockSymbolTable(symbols);
        const libTable = createMockSymbolTable([
            createMockSymbol({
                name: 'MyFun',
                declaration: DeclarationType.Functions,
                arity: 2
            }),
        ]);
        const allSymbolTables = new Map<string, TamarinSymbolTable>([
        ['file:///lib.spthy', libTable],
        ['file:///current.spthy', symbolTable]
        ]);
        const diagnostics = check_function_macros_and_facts_arity(symbolTable, mockDocument,allSymbolTables);
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
        const libTable = createMockSymbolTable([]);
        const allSymbolTables = new Map<string, TamarinSymbolTable>([
        ['file:///lib.spthy', libTable],
        ['file:///current.spthy', symbolTable]
        ]);
        const diagnostics = check_function_macros_and_facts_arity(symbolTable, mockDocument,allSymbolTables);
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
        const libTable = createMockSymbolTable([]);
        const allSymbolTables = new Map<string, TamarinSymbolTable>([
        ['file:///lib.spthy', libTable],
        ['file:///current.spthy', symbolTable]
        ]);
        const diagnostics = check_function_macros_and_facts_arity(symbolTable, mockDocument,allSymbolTables);
        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0].message).toContain("Error: unknown function, macro, or fact 'MyFun'");
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
        const libTable = createMockSymbolTable([]);
        const allSymbolTables = new Map<string, TamarinSymbolTable>([
        ['file:///lib.spthy', libTable],
        ['file:///current.spthy', symbolTable]
        ]);
        const diagnostics = check_function_macros_and_facts_arity(symbolTable, mockDocument,allSymbolTables);
        expect(diagnostics).toHaveLength(2);
        expect(diagnostics[1].message).toContain("Warning: did you mean 'MyFun'?");
    });
});


