const common = require('../common_grammar.js');

module.exports = grammar({
  name: 'spthy', 
  extras: common.extras,
  conflicts: common.conflicts,
  externals: common.externals,
  precedences: common.precedences,
  word: common.word,

  rules: {
    source_file: $ => $.theory,
    theory: $ => seq(
      'theory',
      field('name', $.ident),
      'begin',
      repeat($._body_item),
      'end'
    ),
    ...common.rules,
  }
});