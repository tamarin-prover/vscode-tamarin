import { TextDocument } from 'vscode-languageserver-textdocument';
import { check_infix_operators } from '../checks/checkInfixOperators'; 
import { createMockSymbolTable , createMockNode ,createMockSymbol } from './utils';
import * as Parser from "web-tree-sitter";
import { DeclarationType } from '../../symbol_table/tamarinTypes'; 


const mockDocument = TextDocument.create('file:///test.spthy', 'tamarin', 1, '');

jest.mock('../checks/utils', () => ({
    ...jest.requireActual('../checks/utils'),
    getName: jest.fn((node) => node?.text),
}));


describe('checkInfixOperators', () => {
    it('Should return a warning if the ^ operator is used without the required builtin', () => {
        const node = createMockNode({grammarType: '^'});
        const parentNode = createMockNode({children: [node]});
        const symbolTable = createMockSymbolTable([
            createMockSymbol({
                name: 'hashing',
                declaration: DeclarationType.Builtin
            })
        ]);
        const diagnostics = check_infix_operators(symbolTable, mockDocument,parentNode as Parser.SyntaxNode);
        node.parent = parentNode;
        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0].message).toContain("cannot be used without diffie-hellman");
    });

    it('Should not return a warning if the ^ operator is used with the required builtin', () => {
        const node = createMockNode({grammarType: '^'});
        const parentNode = createMockNode({children: [node]});
        const symbolTable = createMockSymbolTable([
            createMockSymbol({
                name: 'diffie-hellman',
                declaration: DeclarationType.Builtin
            })
        ]);
        const diagnostics = check_infix_operators(symbolTable, mockDocument,parentNode as Parser.SyntaxNode);
        node.parent = parentNode;
        expect(diagnostics).toHaveLength(0);
    });

    it('Should return a warning if the h operator is used without the required builtin', () => {
        const node = createMockNode({ children: [ createMockNode({ grammarType: 'nary_app', children: [ createMockNode({ text: 'h' }) ] }) ] })
        const symbolTable = createMockSymbolTable([
            createMockSymbol({
                name: 'diffie-hellman',
                declaration: DeclarationType.Builtin
            })
        ]);
        const diagnostics = check_infix_operators(symbolTable, mockDocument,node as Parser.SyntaxNode);
        expect(diagnostics).toHaveLength(1);
        
    });

    it('Should not return a warning if the h operator is used with the required builtin', () => {
        const node = createMockNode({ children: [ createMockNode({ grammarType: 'nary_app', children: [ createMockNode({ text: 'h' })]})]})
        const symbolTable = createMockSymbolTable([
            createMockSymbol({
                name: 'hashing',
                declaration: DeclarationType.Builtin
            })
        ]);
        const diagnostics = check_infix_operators(symbolTable, mockDocument,node as Parser.SyntaxNode);
        expect(diagnostics).toHaveLength(0);
    });
});

