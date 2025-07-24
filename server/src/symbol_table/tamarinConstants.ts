export const ReservedFacts: string[] = ['Fr','In','Out','KD','KU','K','diff'] ;

//List of existing builtins add new ones if necessary
export const ExistingBuiltIns : string[] = 
[
    'diffie-hellman',
    'hashing',
    'symmetric-encryption',
    'asymmetric-encryption',
    'signing',
    'revealing-signing',
    'bilinear-pairing',
    'xor',
    'default',
    'natural-numbers',
]

//First the name and then the arity also mind the order above (inv and 1 are diffie-hellman functions etc …)
export const AssociatedFunctions: string[][] = 
[
['inv','1', '1', '0'],
['h', '1'],
['sdec', '2', 'senc', '2'],
['aenc', '2', 'adec', '2', 'pk', '1'],
['sign', '2', 'verify', '3', 'pk', '1', 'true', '0'],
['revealSign', '2', 'revealVerify', '3', 'getMessage', '1', 'pk', '1', 'true', '0'],
['pmult', '2', 'em', '2'],
['XOR', '2', 'zero', '0'],
['fst', '1', 'snd', '1', 'pair', '2']
]
