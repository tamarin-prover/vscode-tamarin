import { TextDocument } from 'vscode-languageserver-textdocument';
import {TamarinSymbol } from '../../symbol_table/tamarinTypes'; 
import { DeclarationType } from '../../symbol_table/tamarinTypes'; 
import {check_case_sensitivity} from '../checks/checkSpelling'; 
import { createMockSymbol, createMockSymbolTable} from './utils';


const mockDocument = TextDocument.create('file:///test.spthy', 'tamarin', 1, '');

describe('checkSpelling', () => {
    it('Should return no errors for a valid Fact name', () => {
        // SCÉNARIO : Fact `MyFact`
        const symbols: TamarinSymbol[] = [
            createMockSymbol({
                name: 'MyFact',
                declaration: DeclarationType.LinearF,
            }),
        ];
        const symbolTable = createMockSymbolTable(symbols);
        const diagnostics = check_case_sensitivity(symbolTable, mockDocument);
        expect(diagnostics).toHaveLength(0);
    });

    it('Should return errors for a non valid Fact name', () => {
        // SCÉNARIO : Fact `myFact`
        const symbols: TamarinSymbol[] = [
            createMockSymbol({
                name: 'myFact',
                declaration: DeclarationType.LinearF,
            }),
        ];
        const symbolTable = createMockSymbolTable(symbols);
        const diagnostics = check_case_sensitivity(symbolTable, mockDocument);
        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0].message).toContain("must start with an uppercase");
    });        

    it('Should not suggest correction to himself ', () => {
        // SCÉNARIO : Fact1 `MyFact` and Fact2 'MyFact'
        const symbols: TamarinSymbol[] = [
            createMockSymbol({
                name: 'MyFact',
                declaration: DeclarationType.LinearF,
            }),
            createMockSymbol({
                name: 'MyFact',
                declaration: DeclarationType.LinearF,
            }),
        ];
        const symbolTable = createMockSymbolTable(symbols);
        const diagnostics = check_case_sensitivity(symbolTable, mockDocument);
        expect(diagnostics).toHaveLength(0);
    });   

    it('Should suggest a correction for a fact with a close typo', () => {
        // SCÉNARIO : Fact1 `MyFact` and Fact2 'MyFcat'
        const symbols: TamarinSymbol[] = [
            createMockSymbol({
                name: 'MyFact',
                declaration: DeclarationType.LinearF,
                /* eslint-disable @typescript-eslint/no-explicit-any */
                nodeOptions: {parent: { grammarType: 'conclusion' }as any}
            }),
            createMockSymbol({
                name: 'MyFcat',
                declaration: DeclarationType.LinearF,
            }),
        ];
        const symbolTable = createMockSymbolTable(symbols);
        const diagnostics = check_case_sensitivity(symbolTable, mockDocument);
        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0].message).toContain("did you mean MyFact ?");
    });   

    it('Should not suggest a correction for a fact too far from the first one', () => {
        // SCÉNARIO : Fact1 `MyFact` and Fact2 'Different'
        const symbols: TamarinSymbol[] = [
            createMockSymbol({
                name: 'MyFact',
                declaration: DeclarationType.LinearF,
                /* eslint-disable @typescript-eslint/no-explicit-any */
                nodeOptions: {parent: { grammarType: 'conclusion' }as any}
            }),
            createMockSymbol({
                name: 'Different',
                declaration: DeclarationType.LinearF,
            }),
        ];
        const symbolTable = createMockSymbolTable(symbols);
        const diagnostics = check_case_sensitivity(symbolTable, mockDocument);
        expect(diagnostics).toHaveLength(0);
    });  

    it('Should not use a fact in a premise as a reference fact for a suggestion', () => {
        // SCÉNARIO : 'FactInPremise should not be a reference fact and FactInPremis is a typo'
        const symbols: TamarinSymbol[] = [
            createMockSymbol({
                name: 'FactInPremise',
                declaration: DeclarationType.LinearF,
                /* eslint-disable @typescript-eslint/no-explicit-any */
                nodeOptions: {parent: { grammarType: 'premise' }as any}
            }),
            createMockSymbol({
                name: 'FactInPremis',
                declaration: DeclarationType.LinearF,
            }),
        ];
        const symbolTable = createMockSymbolTable(symbols);
        const diagnostics = check_case_sensitivity(symbolTable, mockDocument);
        expect(diagnostics).toHaveLength(0);
    });     
    
    it('Should stop after finding the first possible suggestion', () => {
        // SCENARIO 'Two typos'
        const symbols: TamarinSymbol[] = [
            createMockSymbol({
                name: 'MyFactA',
                declaration: DeclarationType.LinearF,
                /* eslint-disable @typescript-eslint/no-explicit-any */
                nodeOptions: {parent: { grammarType: 'conclusion' }as any}
            }),
            createMockSymbol({
                name: 'MyFactB',
                declaration: DeclarationType.LinearF,
                /* eslint-disable @typescript-eslint/no-explicit-any */
                nodeOptions: {parent: { grammarType: 'conclusion' }as any}
            }),
            createMockSymbol({
                name: 'MyFcatA',
                declaration: DeclarationType.LinearF,
            }),
            createMockSymbol({
                name: 'MyFcatB',
                declaration: DeclarationType.LinearF,
            }),

        ];
        const symbolTable = createMockSymbolTable(symbols);
        const diagnostics = check_case_sensitivity(symbolTable, mockDocument);
        expect(diagnostics).toHaveLength(1); //Only one suggestion
    });   

});