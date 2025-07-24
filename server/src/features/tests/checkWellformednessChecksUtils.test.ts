import { TextDocument } from 'vscode-languageserver-textdocument';
import {levenshteinDistance , getName } from '../checks/utils'; 
import {  createMockNode } from './utils';

const mockDocument = TextDocument.create('file:///test.spthy', 'tamarin', 1, '');

describe('checkWellformednessChecksUtils', () => {
    it('Should return none to getName if node has no name', () => {
        const parentNode = createMockNode({
            id: 10,
            grammarType: 'equation',
        });
        const name = getName(parentNode,mockDocument)
        expect(name==="None")
    });

    it('Should return name after getName call', () => {
        const parentNode = createMockNode({
            id: 10,
            grammarType: 'equation',
            name: "MyNode"
        });
        const name = getName(parentNode,mockDocument)
        expect(name==="MyNode")
    });

    it('Levenshtein distance must return correct distance',() =>{
        const name1 = "MyFun";
        const name2 = "MyFuntc";
        const distance = levenshteinDistance(name1,name2);
        expect(distance ===2);
    });

    it('Levenshtein distance with similar string must return 0',() =>{
        const name1 = "MyFun";
        const name2 = "MyFun";
        const distance = levenshteinDistance(name1,name2);
        expect(distance ===0);
    });
});

