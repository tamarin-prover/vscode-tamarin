import { TextDocument } from 'vscode-languageserver-textdocument';
import {TamarinSymbol } from '../../symbol_table/tamarinTypes'; 
import { DeclarationType } from '../../symbol_table/tamarinTypes'; 
import { check_macro_not_in_equation } from '../checks/checkMacrosInEquations'; 
import { createMockSymbol, createMockSymbolTable , } from './utils';


const mockDocument = TextDocument.create('file:///test.spthy', 'tamarin', 1, '');

describe('checkMacrosInEquations', () => {
    it('Should return an error if a macro is used in an equation', () => {
        const symbols: TamarinSymbol[] = [
            createMockSymbol({
                name: 'MyMacro',
                declaration: DeclarationType.Macro,
            }),
            createMockSymbol({
                name: 'MyMacro',
                declaration: DeclarationType.NARY,
                contextOptions: {grammarType: 'equation'}
            }),
        ];
        const symbolTable = createMockSymbolTable(symbols);
        const diagnostics = check_macro_not_in_equation(symbolTable, mockDocument);
        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0].message).toContain("macro shoud not be used in an equation");
    });

    it('Should not return an error if a macro is used outside an equation', () => {
        const symbols: TamarinSymbol[] = [
            createMockSymbol({
                name: 'MyMacro',
                declaration: DeclarationType.Macro,
            }),
            createMockSymbol({
                name: 'MyMacro',
                declaration: DeclarationType.NARY,
                contextOptions: {grammarType: 'rule'}
            }),
        ];
        const symbolTable = createMockSymbolTable(symbols);
        const diagnostics = check_macro_not_in_equation(symbolTable, mockDocument);
        expect(diagnostics).toHaveLength(0);
    });

    it('Should not return an error if a normal function is used in an equation', () => {
        const symbols: TamarinSymbol[] = [
            createMockSymbol({
                name: 'MyMacro',
                declaration: DeclarationType.Functions,
            }),
            createMockSymbol({
                name: 'MyMacro',
                declaration: DeclarationType.NARY,
                contextOptions: {grammarType: 'equation'}
            }),
        ];
        const symbolTable = createMockSymbolTable(symbols);
        const diagnostics = check_macro_not_in_equation(symbolTable, mockDocument);
        expect(diagnostics).toHaveLength(0);
    });
});

