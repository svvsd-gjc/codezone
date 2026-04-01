'use strict';

const { exec } = require('child_process');

/**
 * Runs the given Python file with the provided inputs and returns the resulting output lines.
 * @param {string} file file path
 * @param {string[]} inputs input lines
 * @returns {Promise<string[]>} output lines
 */
async function runWithInputs(file, inputs) {
  const result = await new Promise((resolve, reject) => {
    const proc = exec(`python3 -I "${file}"`, {
      timeout: 5000,
      maxBuffer: 5 * 1024 * 1024,
    }, (err, stdout, stderr) => {
      if (err) reject(err);
      else if (stderr) reject(new Error(stderr));
      else resolve(stdout);
    });
    for (let i = 0; i < inputs.length; i++) {
      proc.stdin.write(inputs[i] + '\n');
    }
    proc.stdin.end();
  });
  return result.trim().split('\n');
}

/**
 * Infers the type of the given output.
 * @param {string|string[]} output
 * @returns {"int"|"float"|"str"}
 */
function inferType(output) {
  const val = Array.isArray(output) ? output[0] : output;
  const k = Number.parseFloat(val);
  if (!Number.isNaN(k) && !Number.isNaN(+val)) {
    return Number.isInteger(k) ? 'int' : 'float';
  }
  return 'str';
}

/**
 * Returns a human-readable difficulty label.
 * @param {number} diff
 * @returns {string}
 */
function difficultyLabel(diff) {
  const d = Number(diff);
  if (d <= 1) return 'Easy';
  if (d <= 2) return 'Medium';
  if (d <= 3) return 'Hard';
  return 'Insane';
}

/**
 * Returns a blessed tag color string for the given difficulty.
 * @param {number} diff
 * @returns {string}
 */
function difficultyColor(diff) {
  const d = Number(diff);
  if (d <= 1) return 'green';
  if (d <= 2) return 'yellow';
  if (d <= 3) return 'red';
  return 'magenta';
}

module.exports = { runWithInputs, inferType, difficultyLabel, difficultyColor };
