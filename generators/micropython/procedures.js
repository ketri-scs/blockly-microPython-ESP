/**
 * @license
 * Visual Blocks Language
 *
 * Copyright 2012 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Generating MicroPython for procedure blocks.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.MicroPython.procedures');

goog.require('Blockly.MicroPython');


Blockly.MicroPython['procedures_defreturn'] = function(block) {
  // Define a procedure with a return value.
  // First, add a 'global' statement for every variable that is not shadowed by
  // a local parameter.
  var globals = [];
  var varName;
  var workspace = block.workspace;
  var variables = Blockly.Variables.allUsedVarModels(workspace) || [];
  for (var i = 0, variable; variable = variables[i]; i++) {
    varName = variable.name;
    if (block.arguments_.indexOf(varName) == -1) {
      globals.push(Blockly.MicroPython.variableDB_.getName(varName,
          Blockly.Variables.NAME_TYPE));
    }
  }
  // Add developer variables.
  var devVarList = Blockly.Variables.allDeveloperVariables(workspace);
  for (var i = 0; i < devVarList.length; i++) {
    globals.push(Blockly.MicroPython.variableDB_.getName(devVarList[i],
        Blockly.Names.DEVELOPER_VARIABLE_TYPE));
  }

  globals = globals.length ?
      Blockly.MicroPython.INDENT + 'global ' + globals.join(', ') + '\n' : '';
  var funcName = Blockly.MicroPython.variableDB_.getName(
      block.getFieldValue('NAME'), Blockly.Procedures.NAME_TYPE);
  var branch = Blockly.MicroPython.statementToCode(block, 'STACK');
  if (Blockly.MicroPython.STATEMENT_PREFIX) {
    var id = block.id.replace(/\$/g, '$$$$');  // Issue 251.
    branch = Blockly.MicroPython.prefixLines(
        Blockly.MicroPython.STATEMENT_PREFIX.replace(
            /%1/g, '\'' + id + '\''), Blockly.MicroPython.INDENT) + branch;
  }
  if (Blockly.MicroPython.INFINITE_LOOP_TRAP) {
    branch = Blockly.MicroPython.INFINITE_LOOP_TRAP.replace(/%1/g,
        '"' + block.id + '"') + branch;
  }
  var returnValue = Blockly.MicroPython.valueToCode(block, 'RETURN',
      Blockly.MicroPython.ORDER_NONE) || '';
  if (returnValue) {
    returnValue = Blockly.MicroPython.INDENT + 'return ' + returnValue + '\n';
  } else if (!branch) {
    branch = Blockly.MicroPython.PASS;
  }
  var args = [];
  for (var i = 0; i < block.arguments_.length; i++) {
    args[i] = Blockly.MicroPython.variableDB_.getName(block.arguments_[i],
        Blockly.Variables.NAME_TYPE);
  }
  var code = 'def ' + funcName + '(' + args.join(', ') + '):\n' +
      globals + branch + returnValue;
  code = Blockly.MicroPython.scrub_(block, code);
  // Add % so as not to collide with helper functions in definitions list.
  Blockly.MicroPython.definitions_['%' + funcName] = code;
  return null;
};

// Defining a procedure without a return value uses the same generator as
// a procedure with a return value.
Blockly.MicroPython['procedures_defnoreturn'] =
    Blockly.MicroPython['procedures_defreturn'];

Blockly.MicroPython['procedures_callreturn'] = function(block) {
  // Call a procedure with a return value.
  var funcName = Blockly.MicroPython.variableDB_.getName(block.getFieldValue('NAME'),
      Blockly.Procedures.NAME_TYPE);
  var args = [];
  for (var i = 0; i < block.arguments_.length; i++) {
    args[i] = Blockly.MicroPython.valueToCode(block, 'ARG' + i,
        Blockly.MicroPython.ORDER_NONE) || 'None';
  }
  var code = funcName + '(' + args.join(', ') + ')';
  return [code, Blockly.MicroPython.ORDER_FUNCTION_CALL];
};

Blockly.MicroPython['procedures_callnoreturn'] = function(block) {
  // Call a procedure with no return value.
  var funcName = Blockly.MicroPython.variableDB_.getName(block.getFieldValue('NAME'),
      Blockly.Procedures.NAME_TYPE);
  var args = [];
  for (var i = 0; i < block.arguments_.length; i++) {
    args[i] = Blockly.MicroPython.valueToCode(block, 'ARG' + i,
        Blockly.MicroPython.ORDER_NONE) || 'None';
  }
  var code = funcName + '(' + args.join(', ') + ')\n';
  return code;
};

Blockly.MicroPython['procedures_ifreturn'] = function(block) {
  // Conditionally return value from a procedure.
  var condition = Blockly.MicroPython.valueToCode(block, 'CONDITION',
      Blockly.MicroPython.ORDER_NONE) || 'False';
  var code = 'if ' + condition + ':\n';
  if (block.hasReturnValue_) {
    var value = Blockly.MicroPython.valueToCode(block, 'VALUE',
        Blockly.MicroPython.ORDER_NONE) || 'None';
    code += Blockly.MicroPython.INDENT + 'return ' + value + '\n';
  } else {
    code += Blockly.MicroPython.INDENT + 'return\n';
  }
  return code;
};
