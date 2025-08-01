import { TextDocument } from 'vscode-languageserver-textdocument';
import { Position} from 'vscode-languageserver-types';
import { AnalysisManager } from '../../AnalysisManager';
import * as path from 'path';

let analysisManager: AnalysisManager;
const docUri = 'file:///test.spthy';


beforeAll(async () => {
    analysisManager = new AnalysisManager();
    const SpthyParserPath = path.resolve(process.cwd(), 'server/grammar/tree-sitter-tamarin/tree-sitter-spthy.wasm');
    const SplibParserPath = path.resolve(process.cwd(), 'server/grammar/tree-sitter-tamarin/tree-sitter-splib.wasm');
    await analysisManager.initParsers(SpthyParserPath,SplibParserPath);
});

const setupTest = async (content: string): Promise<TextDocument> => {
    const document = TextDocument.create(docUri, 'tamarin', 1, content);
    await analysisManager.AnalyseDocument(document);
    return document;
};

describe('AnalysisManager: getDefinition', () => {
    it('Should find the definition of a function', async () => {
        const content = `
        theory ISO_IEC //Erreur incompréhensible ici 
        begin
        builtins: symmetric-encryption
        functions: my_func/1
        rule test:
        []-->[ Out(my_func()) ]
        end
        `;
        const document = await setupTest(content);
        const position = Position.create(6, 20); 
        const location = analysisManager.getDefinition(document, position);
        expect(location).not.toBeNull();
        expect(location?.uri).toBe(docUri);
        expect(location?.range.start.line).toBe(4); 
    });

    it('Should return null if no symbol has been found', async () => {
        const content = `
        theory ISO_IEC 
        begin
        builtins: symmetric-encryption
        functions: my_func/1
        rule test:
        []-->[ Out(my_func()) ]
        end
        `;
        const document = await setupTest(content);
        const position = Position.create(0, 20); 
        const location = analysisManager.getDefinition(document, position);
        expect(location).toBeNull();
    });
});

describe('AnalysisManager: handleRenameRequest', () => {
    it('Should rename all occurrences of a variable in the same rule', async () => {
        const content = `
theory ISO_IEC
begin
rule rename_me:
[ In(x) ]
--[ K(x) ]->
[ Out(x) ]
end
                    `;
        const document = await setupTest(content);
        const position = Position.create(4, 5); 
        const newName = 'y';
        const workspaceEdit = analysisManager.handleRenameRequest(document, position, newName);
        expect(workspaceEdit).not.toBeNull();
        const edits = workspaceEdit?.changes?.[docUri];
        expect(edits).toBeDefined();
        expect(edits).toHaveLength(3); 
        edits?.forEach(edit => {
            expect(edit.newText).toBe(newName);
        });
    });
    it('Should not rename a variable of the same name in another rule', async () => {
        const content = `
theory ISO_IEC
begin
builtins: symmetric-encryption
functions: my_func/1
rule r1: [ In(x) ]-->[ Out(x) ]
rule r2: [ In(x) ]-->[]
end
            `;
        const document = await setupTest(content);
        const position = Position.create(5, 14);
        const newName = 'y';
        const workspaceEdit = analysisManager.handleRenameRequest(document, position, newName);
        const edits = workspaceEdit?.changes?.[docUri];
        expect(edits).toBeDefined();
        expect(edits).toHaveLength(2);
    });
});