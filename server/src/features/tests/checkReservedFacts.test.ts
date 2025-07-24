import { TextDocument } from 'vscode-languageserver-textdocument';
import {check_reserved_facts} from '../checks/checkReservedFacts'; 
import { createMockNode} from './utils';
import * as Parser from "web-tree-sitter";


//mock of getName helper 
jest.mock('../checks/utils', () => ({
    ...jest.requireActual('../checks/utils'), 
    getName: jest.fn((node) => node?.text), 
}));

const mockDocument = TextDocument.create('file:///test.spthy', 'tamarin', 1, '');

describe('checkReservedFacts', () => {
    it('Should return a warning if Fr is used in a conclusion', () => {
        const frNode = createMockNode({
            id: 1,
            grammarType: 'linear_fact',
            children: [
                createMockNode({ id: 2, text: 'Fr' }),
                createMockNode({ id: 4, text: 'a' }),
            ]
        });
        const parentNode = createMockNode({
            id: 10,
            grammarType: 'conclusion',
            children: [frNode]
        });
        const diagnostics = check_reserved_facts(parentNode as Parser.SyntaxNode, mockDocument);
        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0].message).toContain("Fr fact cannot be used in conclusion of a rule");
    });

    it('Should return a warning if In is used in a conclusion', () => {
        const frNode = createMockNode({
            id: 1,
            grammarType: 'linear_fact',
            children: [
                createMockNode({ id: 2, text: 'In' }),
                createMockNode({ id: 4, text: 'a' }),
            ]
        });
        const parentNode = createMockNode({
            id: 10,
            grammarType: 'conclusion',
            children: [frNode]
        });
        const diagnostics = check_reserved_facts(parentNode as Parser.SyntaxNode, mockDocument);
        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0].message).toContain("In fact cannot be used in conclusion of a rule");
    });

    it('Should return a warning if Out is used in a premise', () => {
        const frNode = createMockNode({
            id: 1,
            grammarType: 'linear_fact',
            children: [
                createMockNode({ id: 2, text: 'Out' }),
                createMockNode({ id: 4, text: 'a' }),
            ]
        });
        const parentNode = createMockNode({
            id: 10,
            grammarType: 'premise',
            children: [frNode]
        });
        const diagnostics = check_reserved_facts(parentNode as Parser.SyntaxNode, mockDocument);
        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0].message).toContain("Out fact cannot be used in premise of a rule");
    });

    it('Should return an error if Fr is used with an incorrect arity', () => {
        const frNode = createMockNode({
            id: 1,
            grammarType: 'linear_fact',
            children: [
                createMockNode({ id: 2, text: 'Fr' }),
                createMockNode({ id: 4, text: 'a' }),
                createMockNode({ id: 7, text: 'b'})
            ]
        });
        const parentNode = createMockNode({
            id: 10,
            grammarType: 'premise',
            children: [frNode]
        });
        const diagnostics = check_reserved_facts(parentNode as Parser.SyntaxNode, mockDocument);
        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0].message).toContain("incorrect arity for Fr fact");
    });

    it('Should return an error if Out is used with an incorrect arity', () => {
        const frNode = createMockNode({
            id: 1,
            grammarType: 'linear_fact',
            children: [
                createMockNode({ id: 2, text: 'Out' }),
                createMockNode({ id: 4, text: 'a' }),
                createMockNode({ id: 7, text: 'b'})
            ]
        });
        const parentNode = createMockNode({
            id: 10,
            grammarType: 'conclusion',
            children: [frNode]
        });
        const diagnostics = check_reserved_facts(parentNode as Parser.SyntaxNode, mockDocument);
        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0].message).toContain("incorrect arity for Out fact");
    });

    it('Should return an error if In is used with an incorrect arity', () => {
        const frNode = createMockNode({
            id: 1,
            grammarType: 'linear_fact',
            children: [
                createMockNode({ id: 2, text: 'In' }),
                createMockNode({ id: 4, text: 'a' }),
                createMockNode({ id: 7, text: 'b'})
            ]
        });
        const parentNode = createMockNode({
            id: 10,
            grammarType: 'premise',
            children: [frNode]
        });
        const diagnostics = check_reserved_facts(parentNode as Parser.SyntaxNode, mockDocument);
        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0].message).toContain("incorrect arity for In fact");
    });

    it('Should return an error if Diff is used with an incorrect arity', () => {
        const frNode = createMockNode({
            id: 1,
            grammarType: 'linear_fact',
            children: [
                createMockNode({ id: 2, text: 'diff' }),
                createMockNode({ id: 4, text: 'a' }),
            ]
        });
        const parentNode = createMockNode({
            id: 10,
            grammarType: 'premise',
            children: [frNode]
        });
        const diagnostics = check_reserved_facts(parentNode as Parser.SyntaxNode, mockDocument);
        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0].message).toContain("Error : incorrect arity for diff fact, 2 arguments expected");
    });

    it('should return a warning if Diff is used in a equation', () => {
        const DiffNode = createMockNode({
            id: 1,
            grammarType: 'nary_app',
            children: [
                createMockNode({ text: 'diff' })
            ]
        });
        const parentNode = createMockNode({
            id: 10,
            grammarType: 'equation',
            children: [DiffNode]
        });
        DiffNode.parent = parentNode;
        const diagnostics = check_reserved_facts(parentNode as Parser.SyntaxNode, mockDocument);
        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0].message).toContain("Warning  :  diff fact cannot be used in an equation");
    });

    it('should return a warning if K is used in a rule', () => {
        // also works with KU and KD
        const KUNode = createMockNode({
            id: 1,
            grammarType: 'linear_fact',
            children: [
                createMockNode({ text: 'K' })
            ]
        });
        const parentNode = createMockNode({
            id: 10,
            grammarType: 'premise',
            children: [KUNode]
        });
        const grandParentNode = createMockNode({
            id: 13,
            grammarType: 'simple_rule',
            children: [parentNode]
        })
        parentNode.parent = grandParentNode;
        KUNode.parent = parentNode;
        const diagnostics = check_reserved_facts(grandParentNode as Parser.SyntaxNode, mockDocument);
        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0].message).toContain("not supposed to use KD KU or action K in a rule");
    });
});