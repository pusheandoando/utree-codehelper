# Universal Tree (utree) - Code Helper
A Visual Studio Code extension that safely applies AI-proposed codebase changes while keeping developers in control through step-by-step review and approval.

Instead of blind vibe coding, utree-codehelper generates a structured prompt from your project context, lets you paste the AI response back, and walks you through each proposed change (one at a time) before anything touches disk.

Written by Christian (@pusheandoando)





## AI response format
The extension expects AI responses to contain `@@COMMAND` blocks. Example:

```
@@COMMAND: REPLACE_FRAGMENT
@@PATH: src/core/constants.js
@@START_MARKER:
const BINARY_FILE_NAME = 'utree';
@@END_MARKER:
const BINARY_FILE_NAME = 'utree';
@@NEW_CONTENT:
const BINARY_FILE_NAME = process.platform === 'win32' ? 'utree.exe' : 'utree';
@@END_COMMAND
```

Supported command types: `CREATE_SCRIPT`, `DELETE_SCRIPT`, `CREATE_FOLDER`, `DELETE_FOLDER`, `REPLACE_FRAGMENT`.

The full command syntax is included automatically in every generated prompt, so the AI model receives the format specification as part of the context.





## Development
### Requirements
- Node.js 18 or later
- VS Code 1.125.0 or later

### Run in development
Clone the repository and install dependencies:

```bash
git clone https://github.com/pusheandoando/utree-codehelper.git
cd utree-codehelper
npm install
```

Open the project in VS Code, then press `F5` to launch a new Extension Development Host window with the extension loaded. Alternatively, use the **Run Extension** launch configuration from the Run and Debug panel.

```bash
code .
# then press F5
```

Changes to the extension source require reloading the Extension Development Host window (`Ctrl+R` or `Cmd+R` inside it).


### Lint
```bash
npm run lint
```





## Dependencies
The extension automatically downloads the `utree` binary from the latest GitHub release at https://github.com/pusheandoando/utree on first activation. The binary is stored in `~/.utree_codehelper/code/utree` and reused across sessions.