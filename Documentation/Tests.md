# Tests
## Overview
Tests folder is located in server/src/features/tests
Run ```npm run test``` to test all, this command will also call the lint script.
Tests are done using jest , jest configuration is located in jest.config.js 
## Linter
The linter is ran before the tests
```.eslint.js``` : This file is a setup file for the linter, currently, the linter is pretty harsh, some rules may be turned off if necessary.
## List of all tests
### checkArity
  checkArity
    ✓ Should return an error if a function is called with the wrong arity
    ✓ Should not return an error if a function is called with the correct arity
    ✓ Should ignore arity checking if the usage has arity zero 
    ✓ Should return an error for a function used but never declared
    ✓ Should suggest a fix for an unknown function with a typo
### checkMacrosInEquations
  checkMacrosInEquations
    ✓ Should return an error if a macro is used in an equation
    ✓ Should not return an error if a macro is used outside an equation
    ✓ Should not return an error if a normal function is used in an equation
### checkVariableScope       
  checkVariableScope
    ✓ Should return no errors for a valid rule
    ✓ Should return an error if a conclusion variable is not in the premise
    ✓ Should ignore public variables
    ✓ Should return an error if a fact in a premise is never used in a conclusion       
### createSymbolTable
  createSymbolTable
    ✓ Should create a symbol of type "Functions" with the correct arity 
    ✓ Should create a symbol of type "Rule" for a rule declaration
    ✓ Should create a symbol of type "Lemma" for a lemma declaration
    ✓ Should assign the same context to variables in the same rule
    ✓ Should assign different contexts to variables with the same name in different rules
    ✓ Should identify a persistent fact with "!" and assign it the correct type
### analysisManager   
  AnalysisManager: getDefinition
    ✓ Should find the definition of a function 
    ✓ Should return null if no symbol has been found
  AnalysisManager: handleRenameRequest
    ✓ Should rename all occurrences of a variable in the same rule 
    ✓ Should not rename a variable of the same name in another rule
### checkFreeTerms       
  checkFreeTerms
    ✓ Should not return any errors if the variable is a direct child of a quantifier
    ✓ Should not return any errors if the variable is bound by a quantifier in a parent context
    ✓ Should return a warning if the variable is not bound by any quantifier 
### checkReservedFacts      
  checkReservedFacts
    ✓ Should return a warning if Fr is used in a conclusion
    ✓ Should return a warning if In is used in a conclusion
    ✓ Should return a warning if Out is used in a premise
    ✓ Should return an error if Fr is used with an incorrect arity 
    ✓ Should return an error if Out is used with an incorrect arity
    ✓ Should return an error if In is used with an incorrect arity
    ✓ Should return an error if Diff is used with an incorrect arity
    ✓ should return a warning if Diff is used in a equation 
    ✓ should return a warning if K is used in a rule
### checkVariableTypes  
  checkVariableTypes
    ✓ Should return no errors for coherent variables types
    ✓ Should return an error for rule variables with inconsistent types
    ✓ Should not confuse variables with the same name in different rules
    ✓ Should return no errors for a well-formed equation
    ✓ Should return an error if a variable on the right side of the equation does not exist on the left side
    ✓ Should return no errors for a well-formed macro
    ✓ Should return an error if a variable on the right side of the macro does not exist on the left side
    ✓ Should ignore public variables to the right of a macro
### checkActionFacts  
  checkActionFacts
    ✓ Should return an error if an action fact is used without ever being declared
    ✓ Should not return an error if an action fact is used after being declared
    ✓ Should return an error if an action fact is used with inconsistent arity
    ✓ Should not return an error if an action fact is used with consistent arity
### checkInfixOperators  
  checkInfixOperators
    ✓ Should return a warning if the ^ operator is used without the required builtin 
    ✓ Should not return a warning if the ^ operator is used with the required builtin
    ✓ Should return a warning if the h operator is used without the required builtin
    ✓ Should not return a warning if the h operator is used with the required builtin
### checkSpelling           
  checkSpelling
    ✓ Should return no errors for a valid Fact name
    ✓ Should return errors for a non valid Fact name
    ✓ Should not suggest correction to himself 
    ✓ Should suggest a correction for a fact with a close typo
    ✓ Should not suggest a correction for a fact too far from the first one
    ✓ Should not use a fact in a premise as a reference fact for a suggestion
    ✓ Should stop after finding the first possible suggestion
### checkWellformednessChecksUtils
  checkWellformednessChecksUtils
    ✓ Should return none to getName if node has no name
    ✓ Should return name after getName call
    ✓ Levenshtein distance must return correct distance
    ✓ Levenshtein distance with similar string must return 0