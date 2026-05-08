# CodeZone CLI
The CLI is an interactive TUI (Terminal User Interface) for managing the CodeZone platform. It supports full mouse and keyboard navigation. To launch it:
```bash
cd cli
node index.js
```

## Navigation
- **Arrow keys** or **mouse** to navigate menus and tables
- **Enter** to select
- **Esc** to go back
- **Ctrl+C** to quit

The top bar displays the connected MongoDB database and a breadcrumb trail showing your current location.

## Features

### Problems
- **Add from File** — Parse a Python problem file (see format below), automatically compute outputs by running the script, and preview all test cases before saving.
- **Add from Directory** — Batch-import all `.py` files from a directory with a live progress log.
- **Add Manually** — Step-by-step wizard for entering problem metadata and building test cases interactively, with a live-updating case table.
- **List All Problems** — View all problems in a table. Select one to see full details (including all example and test cases with inputs/outputs), or press `d` to delete.

### Users
- **Add User** — Create a user with username, password, team, and organizer flag.
- **List All Users** — View all users in a table. Press `d` to delete (organizer accounts are protected).

### Tools
- **Test Case Generator** — Specify a Python file, then interactively enter inputs. The TUI runs the file and displays the computed outputs in a growing table, with JSON output at the end.
- **Create Case Set** — Manually build a set of test cases (inputs, outputs, type) with a live preview table, and view the resulting JSON.

### Database
- **Seed Database** — Add default data (root user and sample problem).
- **Clean Database** — Remove all non-organizer users and reset problem completion data. Requires double confirmation.

### Config
- View the current `code-comp.json` platform settings.

## Problem file format
Every problem file must contain a header that stores important information about the problem. An example problem might look like:
```py
#**
#name Add
#desc Add two numbers and print their sum.
#points 1
#difficulty 1
#examples 1|1,2|2
#tests 3|3,4|4
#**

print(int(input()) + int(input()))
```

In this example, the problem has a difficulty level of one (Easy) and yields one point. The name of the problem is `Add`, with a fitting description. The example and test cases have their own format, where each case is separated by a comma, and each input within that case is separated with a pipe. Commas can be escaped with `\,`.

When adding from a file, the CLI will run the Python script with each set of inputs to automatically compute the expected outputs, then display them in a table for review before saving.
