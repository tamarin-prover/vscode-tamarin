import { TextDocument } from 'vscode-languageserver-textdocument';
import { createSymbolTable, TamarinSymbolTable } from '../../symbol_table/create_symbol_table';
import { DeclarationType } from '../../symbol_table/tamarinTypes';
import * as Parser from "web-tree-sitter";
import * as path from 'path';

let parser: Parser;

beforeAll(async () => {
    await Parser.init();
    parser = new Parser();
    const langPath = path.resolve(process.cwd(), 'server/grammar/tree-sitter-tamarin/tree-sitter-spthy.wasm');
    const Tamarin = await Parser.Language.load(langPath);
    parser.setLanguage(Tamarin);
});

const analyseSnippet = async (content: string): Promise<TamarinSymbolTable> => {
    const doc = TextDocument.create('file:///test.spthy', 'tamarin', 1, content);
    const tree = parser.parse(content);
    const { symbolTable } = await createSymbolTable(tree.rootNode, doc);
    return symbolTable;
};

describe('createSymbolTable', () => {
    it('Should create a symbol of type "Functions" with the correct arity', async () => {
        const snippet = `
        theory ISO_IEC
        begin
        builtins: symmetric-encryption
        functions: my_func/2
        rule test:
        []-->[ Out(my_func()) ]
        end
        `;
        const symbolTable = await analyseSnippet(snippet);
        const funcSymbol = symbolTable.getSymbols().find(s => s.name === 'my_func');
        expect(funcSymbol).toBeDefined();
        expect(funcSymbol?.declaration).toBe(DeclarationType.Functions);
        expect(funcSymbol?.arity).toBe(2);
    });

    it('Should create a symbol of type "Rule" for a rule declaration', async () => {
        const snippet = `
        theory ISO_IEC
        begin
        builtins: symmetric-encryption
        functions: my_func/2
        rule test:
        []-->[]
        end
        `;
        const symbolTable = await analyseSnippet(snippet);
        const ruleSymbol = symbolTable.getSymbols().find(s => s.name === 'test');
        expect(ruleSymbol).toBeDefined();
        expect(ruleSymbol?.declaration).toBe(DeclarationType.Rule);
    });

    it('Should create a symbol of type "Lemma" for a lemma declaration', async () => {
        const snippet = `
        theory ISO_IEC
        begin
        builtins: symmetric-encryption
        functions: my_func/2
        rule test:
        []-->[]
        lemma my_lemma: "true"
        end
        `;
        const symbolTable = await analyseSnippet(snippet);
        const lemmaSymbol = symbolTable.getSymbols().find(s => s.name === 'my_lemma');
        expect(lemmaSymbol).toBeDefined();
        expect(lemmaSymbol?.declaration).toBe(DeclarationType.Lemma);
    });

    it('Should assign the same context to variables in the same rule', async () => {
        const snippet = `
        theory ISO_IEC
        begin
        rule a_rule: [ In(x) ] --> [ Out(x) ]
        end
        `;
        const symbolTable = await analyseSnippet(snippet);
        const x_symbols = symbolTable.getSymbols().filter(s => s.name === 'x');
        const contextId = x_symbols[0].context.id;
        const ruleSymbol = symbolTable.getSymbols().find(s => s.name === 'a_rule');
        expect(x_symbols).toHaveLength(2);
        expect(x_symbols[1].context.id).toBe(contextId);
        expect(ruleSymbol).toBeDefined();
        expect(ruleSymbol?.node.id).toBe(contextId);
    });

    it('Should assign different contexts to variables with the same name in different rules', async () => {
        const snippet = `
        theory ISO_IEC
        begin
        rule a_rule: [ In(x) ] --> [ ]
        rule b_rule: [ In(x) ] --> [ ]
        end
        `;
        const symbolTable = await analyseSnippet(snippet);
        const x_symbols = symbolTable.getSymbols().filter(s => s.name === 'x');
        const contextId = x_symbols[0].context.id;
        const ruleSymbol = symbolTable.getSymbols().find(s => s.name === 'a_rule');
        expect(x_symbols).toHaveLength(2);
        expect(x_symbols[1].context.id).not.toBe(contextId);
        expect(ruleSymbol).toBeDefined();
        expect(ruleSymbol?.node.id).toBe(contextId);
    });

    it('Should identify a persistent fact with "!" and assign it the correct type', async () => {
        const snippet = `
        theory ISO_IEC
        begin
        rule a_rule: [ !Fact(a) ] --> [ ]
        rule b_rule: [ In(x) ] --> [ ]
        end
        `;
        const symbolTable = await analyseSnippet(snippet);
        const lemmaSymbol = symbolTable.getSymbols().find(s => s.name === 'Fact');
        expect(lemmaSymbol).toBeDefined();
        expect(lemmaSymbol?.declaration).toBe(DeclarationType.PersistentF);
    });
});