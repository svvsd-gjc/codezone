# CodeZone CLI
The CLI is a tool that's intended to make adding users and problems more accessible. To run the CLI, execute the index file:
```bash
# runs the help command, listing flags, commands, and their relevant arguments
node index.js -h
```

## Adding problem files
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

In this example, the problem has a difficulty level of one, or easy, and yields one point. The name of the problem is `Add`, with a fitting description. The example and test cases have their own format, where each case is separated by a comma, and each line within that case is separated with a pipe. To add the file, we can now run:
```bash
# substitute <path> with source file path...
node index.js add file <path>
```

## Adding many files
Often times, before starting a competition, you must add a large quantity of files to the database at once. Luckily for you, there's a command for such a scenario:
```bash
# substitute <directory> with source directory...
node index.js add dir <directory>
```
All files within the provided directory will be added to the database that's currently connected to the platform. *Be careful, this command does **not** require confirmation, so malformed problem headers could get pushed!*
