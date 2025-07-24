/* eslint-disable @typescript-eslint/no-explicit-any */
import { Range } from 'vscode-languageserver-types';
import {TamarinSymbol } from '../../symbol_table/tamarinTypes'; 
import { TamarinSymbolTable } from '../../symbol_table/create_symbol_table';
import { DeclarationType } from '../../symbol_table/tamarinTypes'; 
import * as Parser from "web-tree-sitter";

export type MockSyntaxNode = Partial<Parser.SyntaxNode> & {
    id: number;
    text?: string;
    grammarType?: string;
    parent?: MockSyntaxNode;
    children?: MockSyntaxNode[];
    previousSibling?: MockSyntaxNode | null;
};

export const createMockNode = (options: any): any => {
    const node: any = {
        id: Math.random(),
        text: '',
        grammarType: 'default_mock_type',
        children: [],
        parent: null,
        startIndex: 0,
        endIndex: 1,
        ...options,
    };
    node.child = (index: number) => node.children[index] || null;
    return node;
};

export interface MockSymbolOptions {
    name: string;
    declaration: DeclarationType;
    nodeOptions?: Partial<MockSyntaxNode>;
    context?: Parser.SyntaxNode;
    contextOptions?: Partial<MockSyntaxNode>;
    type?: string;
    arity?: number;
    associated_qf?: MockSyntaxNode;
}

export const createMockSymbol = (options: MockSymbolOptions): TamarinSymbol => {
    const {
        name,
        declaration,
        type,
        arity,
        context: providedContext,
        contextOptions,
        nodeOptions,
        associated_qf
    } = options;

    const node= createMockNode ({ 
        text: name, 
        ...nodeOptions 
    });

    const context = providedContext || createMockNode({ 
        id: Math.random(), 
        ...contextOptions 
    });

    return {
        name,
        declaration,
        type,
        arity,
        context: context as Parser.SyntaxNode, 
        node: node as Parser.SyntaxNode,
        name_range: Range.create(0, 0, 0, name.length),
        associated_qf: associated_qf as Parser.SyntaxNode | undefined,
    };
};

export const createMockSymbolTable = (symbols: TamarinSymbol[]): TamarinSymbolTable => {
    const table = new TamarinSymbolTable();
    symbols.forEach(symbol => table.addSymbol(symbol));
    return table;
};
