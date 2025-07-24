import * as Parser from "web-tree-sitter";
import { TextDocument } from "vscode-languageserver-textdocument";
import { Diagnostic , DiagnosticSeverity ,Range} from 'vscode-languageserver';


export function build_error_display(node : Parser.SyntaxNode, document: TextDocument, message : string): Diagnostic{
    const start = document.positionAt(node.startIndex);
    const end = document.positionAt(node.endIndex > node.startIndex ? node.endIndex : node.startIndex + 1);
    return{
        range: Range.create(start, end),
        message,
        severity: DiagnosticSeverity.Error,
        source: "tamarin"
    }
}

export function build_warning_display(node : Parser.SyntaxNode, document: TextDocument, message : string): Diagnostic{
    const start = document.positionAt(node.startIndex);
    const end = document.positionAt(node.endIndex > node.startIndex ? node.endIndex : node.startIndex + 1);
    return {
        range: Range.create(start, end),
        message,
        severity: DiagnosticSeverity.Warning,
        source: "tamarin"
    }
}

export function getName(node : Parser.SyntaxNode| null, document: TextDocument): string {
    if (node && node.isNamed) {
        return document.getText(Range.create(
            document.positionAt(node.startIndex),
            document.positionAt(node.endIndex)
        ));
    } else {
        return "None";
    }
}


/* Function used to compare the distance between two strings,
 returns the minimum operations required to convert the first string into the second one */
export function levenshteinDistance(s1: string , s2 : string): number {
    const matrix = [];

    // increment along the first column of each row
    for (let i = 0; i <= s2.length; i++) {
        matrix[i] = [i];
    }

    // increment each column in the first row
    for (let j = 0; j <= s1.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= s2.length; i++) {
        for (let j = 1; j <= s1.length; j++) {
            if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1 // deletion
                    )
                );
            }
        }
    }

    return matrix[s2.length][s1.length];
}

// Function to get the grammar type of a node 
export function get_child_grammar_type(node :Parser.SyntaxNode): string[]{
    const results : string[] = []
    for(const child of node.children) {
        results.push(child.grammarType)
    }
    return results;
}