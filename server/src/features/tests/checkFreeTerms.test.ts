import { TextDocument } from 'vscode-languageserver-textdocument';
import {TamarinSymbol } from '../../symbol_table/tamarinTypes'; 
import { DeclarationType } from '../../symbol_table/tamarinTypes'; 
import {check_free_term_in_lemma} from '../checks/checkFreeTerms'
import { createMockNode, createMockSymbol, createMockSymbolTable , } from './utils';


const mockDocument = TextDocument.create('file:///test.spthy', 'tamarin', 1, '');

describe('checkFreeTerms', () => {
    it('Should not return any errors if the variable is a direct child of a quantifier', () => {
        const xNode = createMockNode({name: 'x'})
        const qfParentNode = createMockNode({
            parent: [xNode],
            grammarType: 'quantified_formula'
        })
        const symbols: TamarinSymbol[] = [
            createMockSymbol({
                name: 'x',
                declaration: DeclarationType.LemmaVariable,
                nodeOptions:{
                    parent: qfParentNode
                }
            })
        ];
        const symbolTable = createMockSymbolTable(symbols);
        const diagnostics = check_free_term_in_lemma(symbolTable, mockDocument);
        expect(diagnostics).toHaveLength(0);
    });
    //FIXME 
    it('Should not return any errors if the variable is bound by a quantifier in a parent context', () => {
        const symbols: TamarinSymbol[] = [
        ];
        const symbolTable = createMockSymbolTable(symbols);
        const diagnostics = check_free_term_in_lemma(symbolTable, mockDocument);
        expect(diagnostics).toHaveLength(0);
    });

    it('Should return a warning if the variable is not bound by any quantifier', () => {
        const grandParentContext = createMockNode({ grammarType: 'theory' });
        const parentContext = createMockNode({ parent: grandParentContext });
        const currentContext = createMockNode({ parent: parentContext });
        const symbols: TamarinSymbol[] = [
            createMockSymbol({
                name: 'x', 
                declaration: DeclarationType.LemmaVariable,
                context: currentContext,
                nodeOptions: { parent: createMockNode({ grammarType: 'some_other_type' }) } 
            })
        ];
        const symbolTable = createMockSymbolTable(symbols);
        const diagnostics = check_free_term_in_lemma(symbolTable, mockDocument);
        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0].message).toContain("free term in lemma or restriction formula");
    });
});

