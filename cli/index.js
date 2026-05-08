#!/usr/bin/env node
'use strict';

const blessed = require('blessed');
const { PrismaClient } = require('@prisma/client');
const sha256 = require('crypto-js/sha256');
const fsPromises = require('fs/promises');
const path = require('path');
const { Header } = require('./header');
const { runWithInputs, inferType, difficultyLabel, difficultyColor } = require('./utils');

const client = new PrismaClient();

// Parse DB info from connection string for display
const dbLabel = (function () {
  try {
    var url = new URL(process.env.MONGO_URL || '');
    var name = url.pathname.replace(/^\//, '') || 'unknown';
    var host = url.hostname || 'localhost';
    return name + '@' + host;
  } catch (e) {
    return process.env.MONGO_URL ? 'custom' : 'not configured';
  }
})();

// ═══════════════════════════════════════════════════════════
//  Screen & Layout
// ═══════════════════════════════════════════════════════════

const screen = blessed.screen({
  smartCSR: true,
  mouse: true,
  fullUnicode: true,
  title: 'CodeZone Admin',
  cursor: {
    artificial: true,
    shape: 'line',
    blink: true,
    color: null,
  },
});

const headerBox = blessed.box({
  parent: screen,
  top: 0,
  left: 0,
  right: 0,
  height: 3,
  border: { type: 'line' },
  style: { border: { fg: 'cyan' } },
  tags: true,
  content: '{center}{bold}{cyan-fg}CodeZone Platform Admin{/cyan-fg}{/bold}  {grey-fg}db:{/grey-fg} {white-fg}' + dbLabel + '{/white-fg}{/center}',
});

const contentBox = blessed.box({
  parent: screen,
  top: 3,
  left: 0,
  right: 0,
  bottom: 3,
  tags: true,
});

const footerBox = blessed.box({
  parent: screen,
  bottom: 0,
  left: 0,
  right: 0,
  height: 3,
  border: { type: 'line' },
  style: { border: { fg: 'cyan' } },
  tags: true,
});

// ═══════════════════════════════════════════════════════════
//  Modal Dialogs
// ═══════════════════════════════════════════════════════════

const questionBox = blessed.question({
  parent: screen,
  top: 'center',
  left: 'center',
  width: '50%',
  height: 'shrink',
  hidden: true,
  border: { type: 'line' },
  style: { border: { fg: 'yellow' }, fg: 'white' },
  tags: true,
  keys: true,
  vi: false,
});

const msgBox = blessed.message({
  parent: screen,
  top: 'center',
  left: 'center',
  width: '50%',
  height: 'shrink',
  hidden: true,
  border: { type: 'line' },
  style: { border: { fg: 'cyan' }, fg: 'white' },
  tags: true,
  keys: true,
});

const loadBox = blessed.loading({
  parent: screen,
  top: 'center',
  left: 'center',
  width: '40%',
  height: 'shrink',
  hidden: true,
  border: { type: 'line' },
  style: { border: { fg: 'yellow' }, fg: 'white' },
  tags: true,
  keys: true,
});

// ═══════════════════════════════════════════════════════════
//  Navigation
// ═══════════════════════════════════════════════════════════

const screenStack = [];
let currentCleanup = null;

function navigate(screenFn, breadcrumb) {
  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }
  screenStack.push({ fn: screenFn, breadcrumb });
  clearContent();
  updateBreadcrumb();
  currentCleanup = screenFn() || null;
  screen.render();
}

function goBack() {
  if (screenStack.length <= 1) return quit();
  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }
  screenStack.pop();
  const prev = screenStack[screenStack.length - 1];
  clearContent();
  updateBreadcrumb();
  currentCleanup = prev.fn() || null;
  screen.render();
}

function clearContent() {
  while (contentBox.children.length) {
    contentBox.children[0].destroy();
  }
}

function updateBreadcrumb() {
  const crumbs = screenStack.map(s => s.breadcrumb).filter(Boolean);
  const trail = crumbs.length
    ? '  {white-fg}' + crumbs.join(' {grey-fg}>{/grey-fg} ') + '{/white-fg}'
    : '';
  headerBox.setContent(
    `{center}{bold}{cyan-fg}CodeZone Platform Admin{/cyan-fg}{/bold}  {grey-fg}db:{/grey-fg} {white-fg}${dbLabel}{/white-fg}${trail}{/center}`
  );
}

function setFooter(text) {
  footerBox.setContent(`{center}${text}{/center}`);
  screen.render();
}

function quit() {
  client.$disconnect().then(() => process.exit(0)).catch(() => process.exit(1));
}

// ═══════════════════════════════════════════════════════════
//  UI Helpers
// ═══════════════════════════════════════════════════════════

function createMenu(items, onSelect) {
  const labels = items.map(i => (typeof i === 'string' ? i : i.label));
  const list = blessed.list({
    parent: contentBox,
    top: 1,
    left: 2,
    right: 2,
    bottom: 1,
    items: labels,
    keys: true,
    mouse: true,
    interactive: true,
    style: {
      fg: 'white',
      selected: { bg: 'blue', fg: 'white', bold: true },
    },
    padding: { left: 1 },
  });

  list.on('select', (el, idx) => {
    const item = items[idx];
    const val = typeof item === 'string' ? idx : (item.value !== undefined ? item.value : idx);
    onSelect(val, idx);
  });

  list.key('escape', () => goBack());
  list.focus();
  return list;
}

function createScrollArea(opts) {
  const o = opts || {};
  return blessed.box({
    parent: contentBox,
    top: o.top || 0,
    left: 0,
    right: 0,
    bottom: o.bottom || 0,
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    mouse: true,
    tags: true,
    scrollbar: { ch: '\u2502', style: { fg: 'cyan' } },
  });
}

function padColumns(headers, rows) {
  var allRows = [headers].concat(rows);
  var widths = headers.map(function (h, i) {
    return allRows.reduce(function (max, row) {
      return Math.max(max, (row[i] || '').length);
    }, 0);
  });
  function formatRow(row) {
    return row.map(function (cell, i) {
      var s = String(cell || '');
      return s + ' '.repeat(Math.max(0, widths[i] - s.length));
    }).join('  ');
  }
  return { formatRow: formatRow, widths: widths };
}

function createTable(parent, headers, rows, opts) {
  const o = opts || {};

  if (o.interactive) {
    // Use blessed.list for interactive tables (proper selection highlight)
    var fmt = padColumns(headers, rows);
    var headerLine = fmt.formatRow(headers);
    var items = rows.map(function (r) { return fmt.formatRow(r); });

    var headerText = blessed.text({
      parent: parent,
      top: o.top != null ? o.top : 0,
      left: (o.left != null ? o.left : 2) + 1,
      right: (o.right != null ? o.right : 2) + 1,
      height: 1,
      content: headerLine,
      style: { fg: 'cyan', bold: true },
    });

    var list = blessed.list({
      parent: parent,
      top: (o.top != null ? o.top : 0) + 1,
      left: o.left != null ? o.left : 2,
      right: o.right != null ? o.right : 2,
      height: items.length + 2,
      items: items,
      border: { type: 'line' },
      style: {
        border: { fg: 'grey' },
        fg: 'white',
        selected: { bg: 'blue', fg: 'white', bold: true },
      },
      keys: true,
      mouse: true,
      interactive: true,
      padding: { left: 0 },
    });

    // Expose selected as 1-indexed (matching listtable behavior where 0 = header)
    Object.defineProperty(list, '_realSelected', {
      get: function () { return list.selected; },
    });

    return list;
  }

  // Non-interactive: use listtable for static display
  const data = [headers].concat(rows);
  const tbl = blessed.listtable({
    parent: parent,
    top: o.top != null ? o.top : 0,
    left: o.left != null ? o.left : 2,
    right: o.right != null ? o.right : 2,
    height: data.length + 2,
    data: data,
    border: { type: 'line' },
    style: {
      border: { fg: 'grey' },
      header: { fg: 'cyan', bold: true },
      cell: { fg: 'white' },
    },
    align: 'left',
    keys: false,
    mouse: false,
    interactive: false,
    pad: 1,
  });
  return tbl;
}

function renderCases(parent, title, cases, y) {
  if (title) {
    blessed.text({
      parent: parent,
      top: y,
      left: 2,
      content: '{bold}{cyan-fg}' + title + '{/cyan-fg}{/bold}',
      tags: true,
    });
    y += 1;
  }

  const entries = Object.entries(cases || {});
  if (!entries.length) {
    blessed.text({
      parent: parent,
      top: y,
      left: 4,
      content: '{grey-fg}(none){/grey-fg}',
      tags: true,
    });
    return y + 2;
  }

  const headers = ['#', 'Inputs', 'Outputs', 'Type'];
  const rows = entries.map(function (pair) {
    var k = pair[0], c = pair[1];
    return [
      k.replace('case', ''),
      (Array.isArray(c.inputs) ? c.inputs : [c.inputs]).join(', '),
      (Array.isArray(c.outputs) ? c.outputs : [c.outputs]).join(', '),
      c.type || 'str',
    ];
  });

  createTable(parent, headers, rows, { top: y, left: 4, right: 4 });
  return y + rows.length + 3;
}

// ── Promise-based dialog wrappers ────────────────────────

function inputAsync(label, defaultVal) {
  return new Promise(function (resolve) {
    var modal = blessed.box({
      parent: screen,
      top: 'center',
      left: 'center',
      width: '60%',
      height: 7,
      border: { type: 'line' },
      style: { border: { fg: 'yellow' }, fg: 'white' },
      tags: true,
      label: ' Input ',
    });
    blessed.text({
      parent: modal,
      top: 0,
      left: 1,
      content: label,
      style: { fg: 'white' },
      tags: true,
    });
    var input = blessed.textbox({
      parent: modal,
      top: 2,
      left: 1,
      right: 1,
      height: 1,
      inputOnFocus: true,
      style: { fg: 'white', focus: { fg: 'white' } },
    });
    if (defaultVal) input.setValue(defaultVal);

    input.on('submit', function (val) {
      modal.destroy();
      screen.render();
      resolve(val || '');
    });
    input.on('cancel', function () {
      modal.destroy();
      screen.render();
      resolve(null);
    });

    input.focus();
    screen.render();
  });
}

function confirmAsync(msg) {
  return new Promise(function (resolve) {
    questionBox.ask(msg, function (err, val) {
      resolve(!err && val);
    });
  });
}

function messageAsync(text, seconds) {
  return new Promise(function (resolve) {
    msgBox.display(text, seconds || 0, function () { resolve(); });
  });
}

function selectAsync(title, choices) {
  return new Promise(function (resolve) {
    var modal = blessed.list({
      parent: screen,
      top: 'center',
      left: 'center',
      width: '50%',
      height: Math.min(choices.length + 4, 20),
      border: { type: 'line' },
      style: {
        border: { fg: 'yellow' },
        fg: 'white',
        selected: { bg: 'blue', fg: 'white', bold: true },
      },
      label: ' ' + title + ' ',
      items: choices,
      keys: true,
      mouse: true,
      interactive: true,
      padding: { left: 1 },
    });

    modal.on('select', function (el, idx) {
      modal.destroy();
      screen.render();
      resolve(idx);
    });

    modal.key('escape', function () {
      modal.destroy();
      screen.render();
      resolve(null);
    });

    modal.focus();
    screen.render();
  });
}

function waitForKey(widget, acceptKeys) {
  return new Promise(function (resolve) {
    var handler = function (ch, key) {
      if (acceptKeys.indexOf(key.name) !== -1) {
        widget.removeListener('keypress', handler);
        resolve(key.name);
      }
    };
    widget.on('keypress', handler);
  });
}

// ═══════════════════════════════════════════════════════════
//  Core Logic Helpers
// ═══════════════════════════════════════════════════════════

async function processFile(filePath) {
  var content = await fsPromises.readFile(filePath, 'utf-8');
  var header = new Header(content);

  var genCases = async function (inputs) {
    var tmp = {};
    await Promise.all(inputs.map(async function (input, i) {
      var out = await runWithInputs(filePath, input);
      tmp['case' + i] = { inputs: input, outputs: out, type: inferType(out) };
    }));
    return tmp;
  };

  header.examples = await genCases(header.examples);
  header.tests = await genCases(header.tests);
  return header;
}

async function saveProblem(header) {
  return client.problem.create({
    data: {
      name: header.name,
      description: header.desc,
      points: Number.parseInt(header.points),
      difficulty: Number.parseInt(header.difficulty),
      example_cases: header.examples,
      test_cases: header.tests,
    },
  });
}

function renderProblemPreview(parent, info, exampleCases, testCases) {
  var y = 1;
  blessed.text({ parent: parent, top: y, left: 2, tags: true,
    content: '{bold}Name:{/bold} ' + info.name });
  y++;
  blessed.text({ parent: parent, top: y, left: 2, tags: true,
    content: '{bold}Description:{/bold} ' + info.desc });
  y++;
  blessed.text({ parent: parent, top: y, left: 2, tags: true,
    content: '{bold}Points:{/bold} ' + info.points +
             '  {bold}Difficulty:{/bold} ' + difficultyLabel(info.difficulty) });
  y += 2;

  y = renderCases(parent, 'Example Cases', exampleCases, y);
  y += 1;
  y = renderCases(parent, 'Test Cases', testCases, y);
  return y;
}

// ═══════════════════════════════════════════════════════════
//  Interactive Case Set Builder
// ═══════════════════════════════════════════════════════════

async function buildCaseSet(title) {
  var cases = {};
  var n = 0;

  while (true) {
    clearContent();

    blessed.text({
      parent: contentBox,
      top: 1,
      left: 2,
      content: '{bold}{cyan-fg}' + title + '{/cyan-fg}{/bold}  ({bold}' + n + '{/bold} case' + (n !== 1 ? 's' : '') + ')',
      tags: true,
    });

    if (n > 0) {
      var headers = ['#', 'Inputs', 'Outputs', 'Type'];
      var rows = Object.entries(cases).map(function (pair) {
        var k = pair[0], c = pair[1];
        return [
          k.replace('case', ''),
          c.inputs.join(', '),
          c.outputs.join(', '),
          c.type,
        ];
      });
      createTable(contentBox, headers, rows, { top: 3 });
    }

    var hintY = n > 0 ? n + 6 : 4;
    blessed.text({
      parent: contentBox,
      top: hintY,
      left: 2,
      content: 'Press {bold}Enter{/bold} to add a case, {bold}Esc{/bold} when done',
      tags: true,
    });

    var keyTarget = blessed.box({
      parent: contentBox,
      top: hintY + 1,
      left: 0,
      width: 1,
      height: 1,
      keyable: true,
    });
    keyTarget.focus();
    screen.render();

    var action = await waitForKey(keyTarget, ['return', 'enter', 'escape']);
    if (action === 'escape') break;

    var inputsStr = await inputAsync('Inputs (pipe | separated):');
    if (inputsStr == null) continue;

    var outputsStr = await inputAsync('Outputs (pipe | separated):');
    if (outputsStr == null) continue;

    var typeIdx = await selectAsync('Output type', ['int', 'float', 'str']);
    if (typeIdx == null) continue;

    cases['case' + n] = {
      inputs: inputsStr.split('|').map(function (s) { return s.trim(); }),
      outputs: outputsStr.split('|').map(function (s) { return s.trim(); }),
      type: ['int', 'float', 'str'][typeIdx],
    };
    n++;
  }

  return cases;
}

// ═══════════════════════════════════════════════════════════
//  SCREEN: Main Menu
// ═══════════════════════════════════════════════════════════

function mainMenuScreen() {
  createMenu([
    { label: '  Problems          Manage competition problems', value: 'problems' },
    { label: '  Users             Manage user accounts', value: 'users' },
    { label: '  Tools             Test case utilities', value: 'tools' },
    { label: '  Database          Seed & reset operations', value: 'database' },
    { label: '  Config            View platform settings', value: 'config' },
    { label: '  Exit', value: 'exit' },
  ], function (val) {
    switch (val) {
      case 'problems': navigate(problemsMenuScreen, 'Problems'); break;
      case 'users':    navigate(usersMenuScreen, 'Users'); break;
      case 'tools':    navigate(toolsMenuScreen, 'Tools'); break;
      case 'database': navigate(databaseMenuScreen, 'Database'); break;
      case 'config':   navigate(configScreen, 'Config'); break;
      case 'exit':     quit(); break;
    }
  });
  setFooter('{bold}\u2191\u2193{/bold} Navigate  {bold}Enter{/bold} Select  {bold}Esc{/bold} Quit');
}

// ═══════════════════════════════════════════════════════════
//  SCREENS: Problems
// ═══════════════════════════════════════════════════════════

function problemsMenuScreen() {
  createMenu([
    { label: '  Add from File', value: 'file' },
    { label: '  Add from Directory', value: 'dir' },
    { label: '  Add Manually', value: 'manual' },
    { label: '  List All Problems', value: 'list' },
    { label: '  Back', value: 'back' },
  ], function (val) {
    switch (val) {
      case 'file':   navigate(addFromFileScreen, 'Add from File'); break;
      case 'dir':    navigate(addFromDirScreen, 'Add from Directory'); break;
      case 'manual': navigate(addManualScreen, 'Add Manually'); break;
      case 'list':   navigate(listProblemsScreen, 'List'); break;
      case 'back':   goBack(); break;
    }
  });
  setFooter('{bold}\u2191\u2193{/bold} Navigate  {bold}Enter{/bold} Select  {bold}Esc{/bold} Back');
}

function addFromFileScreen() {
  setFooter('Enter the path to a Python problem file');
  (async function () {
    var filePath = await inputAsync('File path:');
    if (!filePath) return goBack();

    loadBox.load('Parsing file and computing outputs...');
    screen.render();

    try {
      var header = await processFile(filePath);
      loadBox.stop();

      clearContent();
      var scroll = createScrollArea();
      renderProblemPreview(scroll, header, header.examples, header.tests);

      scroll.key('escape', function () { goBack(); });
      scroll.focus();
      setFooter('{bold}Enter{/bold} Add to Database  {bold}Esc{/bold} Cancel');
      screen.render();

      var confirmed = await confirmAsync('Add this problem to the database?');
      if (confirmed) {
        await saveProblem(header);
        await messageAsync('{green-fg}Problem added successfully!{/green-fg}', 2);
      }
      goBack();
    } catch (err) {
      loadBox.stop();
      await messageAsync('{red-fg}Error: ' + err.message + '{/red-fg}', 3);
      goBack();
    }
  })();
}

function addFromDirScreen() {
  setFooter('Enter path to directory containing .py problem files');
  (async function () {
    var dirPath = await inputAsync('Directory path:');
    if (!dirPath) return goBack();

    try {
      var files = await fsPromises.readdir(dirPath);
      files = files.filter(function (f) { return f.endsWith('.py'); });

      if (!files.length) {
        await messageAsync('{yellow-fg}No .py files found in directory{/yellow-fg}', 2);
        return goBack();
      }

      clearContent();
      var logBox = blessed.log({
        parent: contentBox,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        border: { type: 'line' },
        style: { border: { fg: 'cyan' }, fg: 'white' },
        scrollable: true,
        keys: true,
        mouse: true,
        tags: true,
        scrollbar: { ch: '\u2502', style: { fg: 'cyan' } },
      });

      logBox.log('Found ' + files.length + ' Python file(s):');
      logBox.log('');
      setFooter('Processing... Please wait');
      screen.render();

      var success = 0, failed = 0;
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        logBox.log('[' + (i + 1) + '/' + files.length + '] ' + file + '...');
        screen.render();

        try {
          var header = await processFile(path.join(dirPath, file));
          await saveProblem(header);
          logBox.log('{green-fg}  \u2713 Added{/green-fg}');
          success++;
        } catch (err) {
          logBox.log('{red-fg}  \u2717 ' + err.message + '{/red-fg}');
          failed++;
        }
        screen.render();
      }

      logBox.log('');
      logBox.log('Done: {green-fg}' + success + ' added{/green-fg}, {red-fg}' + failed + ' failed{/red-fg}');
      logBox.key('escape', function () { goBack(); });
      logBox.focus();
      setFooter('{bold}Esc{/bold} Back');
      screen.render();
    } catch (err) {
      await messageAsync('{red-fg}Error: ' + err.message + '{/red-fg}', 3);
      goBack();
    }
  })();
}

function addManualScreen() {
  (async function () {
    var name = await inputAsync('Problem name:');
    if (!name) return goBack();

    var desc = await inputAsync('Description:');
    if (desc == null) return goBack();

    var pointsStr = await inputAsync('Points:');
    if (pointsStr == null) return goBack();
    var points = parseInt(pointsStr) || 0;

    var diffIdx = await selectAsync('Difficulty', [
      'Easy (1)', 'Medium (2)', 'Hard (3)', 'Insane (4)',
    ]);
    if (diffIdx == null) return goBack();
    var difficulty = diffIdx + 1;

    await messageAsync('Now create {bold}example{/bold} cases (shown to users)', 2);
    var examples = await buildCaseSet('Example Cases');

    await messageAsync('Now create {bold}test{/bold} cases (used for grading)', 2);
    var tests = await buildCaseSet('Test Cases');

    // Preview
    clearContent();
    var scroll = createScrollArea();
    renderProblemPreview(scroll, { name: name, desc: desc, points: points, difficulty: difficulty }, examples, tests);

    scroll.key('escape', function () { goBack(); });
    scroll.focus();
    setFooter('{bold}Enter{/bold} Save  {bold}Esc{/bold} Cancel');
    screen.render();

    var confirmed = await confirmAsync('Save this problem?');
    if (confirmed) {
      try {
        await client.problem.create({
          data: {
            name: name,
            description: desc,
            points: points,
            difficulty: difficulty,
            example_cases: examples,
            test_cases: tests,
          },
        });
        await messageAsync('{green-fg}Problem created successfully!{/green-fg}', 2);
      } catch (err) {
        await messageAsync('{red-fg}Error: ' + err.message + '{/red-fg}', 3);
      }
    }
    goBack();
  })();
}

function listProblemsScreen() {
  setFooter('Loading...');
  (async function () {
    try {
      var problems = await client.problem.findMany({ orderBy: { name: 'asc' } });

      if (!problems.length) {
        clearContent();
        blessed.text({
          parent: contentBox, top: 2, left: 4,
          content: '{grey-fg}No problems found. Add some first!{/grey-fg}',
          tags: true,
        });
        var dummy = blessed.box({ parent: contentBox, top: 4, left: 0, width: 1, height: 1, keyable: true });
        dummy.key('escape', function () { goBack(); });
        dummy.focus();
        setFooter('{bold}Esc{/bold} Back');
        screen.render();
        return;
      }

      clearContent();

      var headers = ['Name', 'Points', 'Difficulty', 'Examples', 'Tests'];
      var rows = problems.map(function (p) {
        var exCount = Object.keys(p.example_cases || {}).length;
        var testCount = Object.keys(p.test_cases || {}).length;
        return [
          p.name,
          String(p.points),
          difficultyLabel(p.difficulty),
          String(exCount),
          String(testCount),
        ];
      });

      var table = createTable(contentBox, headers, rows, { top: 1, interactive: true });

      table.on('select', function (el, idx) {
        var problem = problems[idx];
        if (problem) navigate(function () { return viewProblemScreen(problem); }, problem.name);
      });

      table.key('d', async function () {
        var selected = table.selected;
        if (selected >= 0) {
          var problem = problems[selected];
          if (!problem) return;
          var yes = await confirmAsync('Delete "' + problem.name + '"?');
          if (yes) {
            try {
              await client.problem.delete({ where: { id: problem.id } });
              await messageAsync('{green-fg}Deleted!{/green-fg}', 1);
              clearContent();
              listProblemsScreen();
            } catch (err) {
              await messageAsync('{red-fg}Error: ' + err.message + '{/red-fg}', 2);
            }
          }
          table.focus();
          screen.render();
        }
      });

      table.key('escape', function () { goBack(); });
      table.focus();
      setFooter('{bold}\u2191\u2193{/bold} Navigate  {bold}Enter{/bold} View Details  {bold}d{/bold} Delete  {bold}Esc{/bold} Back');
      screen.render();
    } catch (err) {
      await messageAsync('{red-fg}Error: ' + err.message + '{/red-fg}', 3);
      goBack();
    }
  })();
}

function viewProblemScreen(problem) {
  var scroll = createScrollArea();
  var y = 1;

  blessed.text({ parent: scroll, top: y, left: 2, tags: true,
    content: '{bold}Name:{/bold} ' + problem.name });
  y++;
  blessed.text({ parent: scroll, top: y, left: 2, tags: true,
    content: '{bold}Description:{/bold} ' + problem.description });
  y++;

  var dColor = difficultyColor(problem.difficulty);
  blessed.text({ parent: scroll, top: y, left: 2, tags: true,
    content: '{bold}Points:{/bold} ' + problem.points +
             '  {bold}Difficulty:{/bold} {' + dColor + '-fg}' + difficultyLabel(problem.difficulty) + '{/' + dColor + '-fg}' });
  y++;
  blessed.text({ parent: scroll, top: y, left: 2, tags: true,
    content: '{bold}ID:{/bold} {grey-fg}' + problem.id + '{/grey-fg}' });
  y++;
  blessed.text({ parent: scroll, top: y, left: 2, tags: true,
    content: '{bold}Solvers:{/bold} ' + (problem.account_ids ? problem.account_ids.length : 0) });
  y += 2;

  y = renderCases(scroll, 'Example Cases', problem.example_cases, y);
  y += 1;
  y = renderCases(scroll, 'Test Cases', problem.test_cases, y);

  scroll.key('escape', function () { goBack(); });
  scroll.key('d', async function () {
    var yes = await confirmAsync('Delete "' + problem.name + '"?');
    if (yes) {
      try {
        await client.problem.delete({ where: { id: problem.id } });
        await messageAsync('{green-fg}Deleted!{/green-fg}', 1);
        // Go back twice: past the view screen and the now-stale list
        goBack();
        clearContent();
        listProblemsScreen();
      } catch (err) {
        await messageAsync('{red-fg}Error: ' + err.message + '{/red-fg}', 2);
      }
    }
    scroll.focus();
    screen.render();
  });

  scroll.focus();
  setFooter('{bold}\u2191\u2193{/bold} Scroll  {bold}d{/bold} Delete  {bold}Esc{/bold} Back');
  screen.render();
}

// ═══════════════════════════════════════════════════════════
//  SCREENS: Users
// ═══════════════════════════════════════════════════════════

function usersMenuScreen() {
  createMenu([
    { label: '  Add User', value: 'add' },
    { label: '  List All Users', value: 'list' },
    { label: '  Back', value: 'back' },
  ], function (val) {
    switch (val) {
      case 'add':  navigate(addUserScreen, 'Add User'); break;
      case 'list': navigate(listUsersScreen, 'List'); break;
      case 'back': goBack(); break;
    }
  });
  setFooter('{bold}\u2191\u2193{/bold} Navigate  {bold}Enter{/bold} Select  {bold}Esc{/bold} Back');
}

function addUserScreen() {
  (async function () {
    var name = await inputAsync('Username:');
    if (!name) return goBack();

    var password = await inputAsync('Password:');
    if (password == null) return goBack();

    var teamIdx = await selectAsync('Team', ['Beginner (0)', 'Advanced (1)']);
    if (teamIdx == null) return goBack();

    var orgIdx = await selectAsync('Organizer?', ['No', 'Yes']);
    if (orgIdx == null) return goBack();

    try {
      var pass = sha256(password).toString();
      await client.user.create({
        data: {
          name: name,
          password: pass,
          team: teamIdx,
          organizer: orgIdx === 1,
        },
      });
      await messageAsync('{green-fg}User "' + name + '" created successfully!{/green-fg}', 2);
    } catch (err) {
      await messageAsync('{red-fg}Error: ' + err.message + '{/red-fg}', 3);
    }
    goBack();
  })();
}

function listUsersScreen() {
  setFooter('Loading...');
  (async function () {
    try {
      var users = await client.user.findMany({
        orderBy: { name: 'asc' },
        include: { solved_problems: true },
      });

      if (!users.length) {
        clearContent();
        blessed.text({
          parent: contentBox, top: 2, left: 4,
          content: '{grey-fg}No users found.{/grey-fg}',
          tags: true,
        });
        var dummy = blessed.box({ parent: contentBox, top: 4, left: 0, width: 1, height: 1, keyable: true });
        dummy.key('escape', function () { goBack(); });
        dummy.focus();
        setFooter('{bold}Esc{/bold} Back');
        screen.render();
        return;
      }

      clearContent();

      var headers = ['Name', 'Team', 'Points', 'Solved', 'Organizer'];
      var rows = users.map(function (u) {
        return [
          u.name,
          u.team === 0 ? 'Beginner' : 'Advanced',
          String(u.points),
          String(u.solved_problems ? u.solved_problems.length : 0),
          u.organizer ? 'Yes' : 'No',
        ];
      });

      var table = createTable(contentBox, headers, rows, { top: 1, interactive: true });

      table.key('p', async function () {
        var selected = table.selected;
        if (selected >= 0) {
          var user = users[selected];
          if (!user) return;
          var newPass = await inputAsync('New password for "' + user.name + '":');
          if (newPass == null || newPass === '') { table.focus(); screen.render(); return; }
          try {
            var hashed = sha256(newPass).toString();
            await client.user.update({ where: { id: user.id }, data: { password: hashed } });
            await messageAsync('{green-fg}Password updated for "' + user.name + '"{/green-fg}', 2);
          } catch (err) {
            await messageAsync('{red-fg}Error: ' + err.message + '{/red-fg}', 2);
          }
          table.focus();
          screen.render();
        }
      });

      table.key('t', async function () {
        var selected = table.selected;
        if (selected >= 0) {
          var user = users[selected];
          if (!user) return;
          var teamIdx = await selectAsync('New team for "' + user.name + '"', ['Beginner (0)', 'Advanced (1)']);
          if (teamIdx == null) { table.focus(); screen.render(); return; }
          try {
            await client.user.update({ where: { id: user.id }, data: { team: teamIdx } });
            await messageAsync('{green-fg}Team updated for "' + user.name + '"{/green-fg}', 2);
            clearContent();
            listUsersScreen();
            return;
          } catch (err) {
            await messageAsync('{red-fg}Error: ' + err.message + '{/red-fg}', 2);
          }
          table.focus();
          screen.render();
        }
      });

      table.key('d', async function () {
        var selected = table.selected;
        if (selected >= 0) {
          var user = users[selected];
          if (!user) return;
          if (user.organizer) {
            await messageAsync('{yellow-fg}Cannot delete organizer accounts from here.{/yellow-fg}', 2);
            table.focus();
            screen.render();
            return;
          }
          var yes = await confirmAsync('Delete user "' + user.name + '"?');
          if (yes) {
            try {
              await client.user.delete({ where: { id: user.id } });
              await messageAsync('{green-fg}Deleted!{/green-fg}', 1);
              clearContent();
              listUsersScreen();
              return;
            } catch (err) {
              await messageAsync('{red-fg}Error: ' + err.message + '{/red-fg}', 2);
            }
          }
          table.focus();
          screen.render();
        }
      });

      table.key('escape', function () { goBack(); });
      table.focus();
      setFooter('{bold}\u2191\u2193{/bold} Navigate  {bold}p{/bold} Password  {bold}t{/bold} Team  {bold}d{/bold} Delete  {bold}Esc{/bold} Back');
      screen.render();
    } catch (err) {
      await messageAsync('{red-fg}Error: ' + err.message + '{/red-fg}', 3);
      goBack();
    }
  })();
}

// ═══════════════════════════════════════════════════════════
//  SCREENS: Tools
// ═══════════════════════════════════════════════════════════

function toolsMenuScreen() {
  createMenu([
    { label: '  Test Case Generator   Compute outputs from a Python file', value: 'generator' },
    { label: '  Create Case Set       Build cases manually', value: 'manual' },
    { label: '  Back', value: 'back' },
  ], function (val) {
    switch (val) {
      case 'generator': navigate(testCaseGeneratorScreen, 'Generator'); break;
      case 'manual':    navigate(manualTestCaseScreen, 'Manual'); break;
      case 'back':      goBack(); break;
    }
  });
  setFooter('{bold}\u2191\u2193{/bold} Navigate  {bold}Enter{/bold} Select  {bold}Esc{/bold} Back');
}

function testCaseGeneratorScreen() {
  (async function () {
    var filePath = await inputAsync('Python file path:');
    if (!filePath) return goBack();

    var cases = {};
    var n = 0;

    while (true) {
      clearContent();
      var scroll = createScrollArea();

      blessed.text({
        parent: scroll, top: 0, left: 2, tags: true,
        content: '{bold}{cyan-fg}Test Case Generator{/cyan-fg}{/bold}  File: {grey-fg}' + filePath + '{/grey-fg}',
      });

      if (n > 0) {
        renderCases(scroll, 'Generated Cases', cases, 2);
      } else {
        blessed.text({
          parent: scroll, top: 2, left: 4, tags: true,
          content: '{grey-fg}No cases yet. Press Enter to add one.{/grey-fg}',
        });
      }

      var hintY = n > 0 ? n + 6 : 4;
      blessed.text({
        parent: scroll, top: hintY, left: 2, tags: true,
        content: 'Press {bold}Enter{/bold} to add inputs and compute output, {bold}Esc{/bold} when done',
      });

      scroll.focus();
      setFooter('{bold}Enter{/bold} Add Case  {bold}Esc{/bold} Done');
      screen.render();

      var action = await waitForKey(scroll, ['return', 'enter', 'escape']);
      if (action === 'escape') break;

      var inputsStr = await inputAsync('Inputs (pipe | separated):');
      if (inputsStr == null) continue;

      var inputs = inputsStr.split('|').map(function (s) { return s.trim(); });

      loadBox.load('Running Python file...');
      screen.render();

      try {
        var outputs = await runWithInputs(filePath, inputs);
        loadBox.stop();

        cases['case' + n] = {
          inputs: inputs,
          outputs: outputs,
          type: inferType(outputs),
        };
        n++;
      } catch (err) {
        loadBox.stop();
        await messageAsync('{red-fg}Error running file: ' + err.message + '{/red-fg}', 3);
      }
    }

    // Show final JSON output
    if (n > 0) {
      clearContent();
      var finalScroll = createScrollArea();

      blessed.text({
        parent: finalScroll, top: 0, left: 2, tags: true,
        content: '{bold}{cyan-fg}Generated Test Cases{/cyan-fg}{/bold}  (' + n + ' case' + (n !== 1 ? 's' : '') + ')',
      });

      renderCases(finalScroll, '', cases, 2);

      var jsonY = n + 6;
      blessed.text({
        parent: finalScroll, top: jsonY, left: 2, tags: true,
        content: '{bold}{cyan-fg}JSON Output:{/cyan-fg}{/bold}',
      });
      blessed.text({
        parent: finalScroll, top: jsonY + 1, left: 2,
        content: JSON.stringify(cases, null, 2),
        style: { fg: 'grey' },
      });

      finalScroll.key('escape', function () { goBack(); });
      finalScroll.focus();
      setFooter('{bold}\u2191\u2193{/bold} Scroll  {bold}Esc{/bold} Back');
      screen.render();
    } else {
      goBack();
    }
  })();
}

function manualTestCaseScreen() {
  (async function () {
    var cases = await buildCaseSet('Manual Test Cases');

    if (cases && Object.keys(cases).length > 0) {
      clearContent();
      var scroll = createScrollArea();

      var n = Object.keys(cases).length;
      blessed.text({
        parent: scroll, top: 0, left: 2, tags: true,
        content: '{bold}{cyan-fg}Created Test Cases{/cyan-fg}{/bold}  (' + n + ' case' + (n !== 1 ? 's' : '') + ')',
      });

      renderCases(scroll, '', cases, 2);

      var jsonY = n + 6;
      blessed.text({
        parent: scroll, top: jsonY, left: 2, tags: true,
        content: '{bold}{cyan-fg}JSON Output:{/cyan-fg}{/bold}',
      });
      blessed.text({
        parent: scroll, top: jsonY + 1, left: 2,
        content: JSON.stringify(cases, null, 2),
        style: { fg: 'grey' },
      });

      scroll.key('escape', function () { goBack(); });
      scroll.focus();
      setFooter('{bold}\u2191\u2193{/bold} Scroll  {bold}Esc{/bold} Back');
      screen.render();
    } else {
      goBack();
    }
  })();
}

// ═══════════════════════════════════════════════════════════
//  SCREENS: Database
// ═══════════════════════════════════════════════════════════

function databaseMenuScreen() {
  createMenu([
    { label: '  Seed Database         Add default data (root user + sample problem)', value: 'seed' },
    { label: '  Clean Database        Reset for competition (removes non-organizer users)', value: 'clean' },
    { label: '  Back', value: 'back' },
  ], function (val) {
    switch (val) {
      case 'seed':  navigate(seedScreen, 'Seed'); break;
      case 'clean': navigate(cleanScreen, 'Clean'); break;
      case 'back':  goBack(); break;
    }
  });
  setFooter('{bold}\u2191\u2193{/bold} Navigate  {bold}Enter{/bold} Select  {bold}Esc{/bold} Back');
}

function seedScreen() {
  (async function () {
    var yes = await confirmAsync('Seed the database with default data?\n(root user + sample Sum problem)');
    if (!yes) return goBack();

    loadBox.load('Seeding database...');
    screen.render();

    try {
      await client.user.upsert({
        where: { name: 'root' },
        update: { points: 0 },
        create: {
          name: 'root',
          password: '4813494d137e1631bba301d5acab6e7bb7aa74ce1185d456565ef51d737677b2',
        },
      });

      var existing = await client.problem.findFirst({ where: { name: 'Sum' } });
      if (!existing) {
        await client.problem.create({
          data: {
            name: 'Sum',
            description: 'Add the two numbers together and print the result.',
            difficulty: 1,
            points: 1,
            example_cases: {
              case0: { inputs: ['1', '2'], outputs: ['3'], type: 'int' },
            },
            test_cases: {
              case0: { inputs: ['1', '2'], outputs: ['3'], type: 'int' },
            },
          },
        });
      }

      loadBox.stop();
      await messageAsync('{green-fg}Database seeded successfully!{/green-fg}', 2);
    } catch (err) {
      loadBox.stop();
      await messageAsync('{red-fg}Error: ' + err.message + '{/red-fg}', 3);
    }
    goBack();
  })();
}

function cleanScreen() {
  (async function () {
    var yes = await confirmAsync(
      '{red-fg}{bold}WARNING:{/bold} This will delete ALL non-organizer users\nand reset ALL problem completion data.{/red-fg}\n\nProceed?'
    );
    if (!yes) return goBack();

    var reallyYes = await confirmAsync('Are you absolutely sure? This cannot be undone.');
    if (!reallyYes) return goBack();

    loadBox.load('Cleaning database...');
    screen.render();

    try {
      var deleted = await client.user.deleteMany({
        where: { NOT: { organizer: true } },
      });

      await client.problem.updateMany({
        data: { account_ids: [] },
      });

      loadBox.stop();
      await messageAsync(
        '{green-fg}Cleaned! Removed ' + deleted.count + ' user(s) and reset all problem completions.{/green-fg}', 3
      );
    } catch (err) {
      loadBox.stop();
      await messageAsync('{red-fg}Error: ' + err.message + '{/red-fg}', 3);
    }
    goBack();
  })();
}

// ═══════════════════════════════════════════════════════════
//  SCREEN: Config
// ═══════════════════════════════════════════════════════════

function configScreen() {
  (async function () {
    try {
      var configPath = path.resolve(__dirname, '..', 'code-comp.json');
      var configData = await fsPromises.readFile(configPath, 'utf-8');
      var config = JSON.parse(configData);

      clearContent();
      var scroll = createScrollArea();
      var y = 1;

      blessed.text({
        parent: scroll, top: y, left: 2, tags: true,
        content: '{bold}{cyan-fg}Platform Configuration{/cyan-fg}{/bold}  {grey-fg}(code-comp.json){/grey-fg}',
      });
      y += 2;

      var entries = Object.entries(config);
      for (var i = 0; i < entries.length; i++) {
        var key = entries[i][0], value = entries[i][1];
        var valueColor = typeof value === 'boolean'
          ? (value ? 'green' : 'red')
          : 'white';
        blessed.text({
          parent: scroll, top: y, left: 4, tags: true,
          content: '{bold}' + key + ':{/bold}  {' + valueColor + '-fg}' + value + '{/' + valueColor + '-fg}',
        });
        y++;
      }

      scroll.key('escape', function () { goBack(); });
      scroll.focus();
      setFooter('{bold}Esc{/bold} Back');
      screen.render();
    } catch (err) {
      await messageAsync('{red-fg}Error reading config: ' + err.message + '{/red-fg}', 3);
      goBack();
    }
  })();
}

// ═══════════════════════════════════════════════════════════
//  Global Keys & Boot
// ═══════════════════════════════════════════════════════════

screen.key(['C-c'], function () { quit(); });

navigate(mainMenuScreen, 'Main Menu');
