// src/prompt/commitPromptTemplate.js
const { COMMAND_TYPE } = require('../parser/commandParser');





const COMMIT_FORMAT_EXAMPLE = `fix(prompt): resolve silent hang on New Change and simplify utree exclusions

- Bump version to 1.0.5
- Rewrite promptBuilder.js to delegate exclusion filtering entirely to
  the utree binary via -e, removing the fragile JS-side unique-leaf-name
  heuristic and manual dump-output filtering
- Filter excluded paths down to their root exclusions before building
  the -e argument list, fixing a spawn E2BIG crash caused by passing
  thousands of redundant descendant paths for large excluded folders
  (e.g. node_modules)
- Add error handling in controlPanelProvider.js so failures during
  prompt generation are surfaced via showErrorMessage instead of
  failing silently after the progress notification closes
- Import the missing vscode module in controlPanelProvider.js`;

function describeCommandForCommit(command) {
	switch (command.type) {
		case COMMAND_TYPE.CREATE_SCRIPT:
			return `Created ${command.path}:\n${command.content || ''}`;
		case COMMAND_TYPE.DELETE_SCRIPT:
			return `Deleted ${command.path}`;
		case COMMAND_TYPE.CREATE_FOLDER:
			return `Created folder ${command.path}`;
		case COMMAND_TYPE.DELETE_FOLDER:
			return `Deleted folder ${command.path}`;
		case COMMAND_TYPE.REPLACE_LINES: {
			const hasOldContent = command.oldContent !== null && command.oldContent !== undefined;
			const oldSection = hasOldContent ? `Old code:\n${command.oldContent}` : 'Old code: (not available)';
			return `Modified ${command.path}, replacing lines ${command.startLine}-${command.endLine}:\n${oldSection}\n\nNew code:\n${command.newContent || ''}`;
		}
		default:
			return `${command.type} on ${command.path}`;
	}
}

function buildCommitPrompt(commands) {
	const applicableCommands = commands.filter((command) => !command.parseError);

	const changesSummary = applicableCommands
		.map((command, index) => `${index + 1}. ${describeCommandForCommit(command)}`)
		.join('\n\n');

	return `Below are the code changes that were applied to this project in a single update.

${changesSummary}


RESPONSE FORMAT (MANDATORY)
Based on the changes above, write the ideal git commit message for them.
Respond with nothing else: no reasoning, no explanation, no greeting,
just the commit message itself, in exactly this format:

{type}: {main_title}

- {change summary A}
- {change summary B}
- {change summary C}

Where {type} follows the Conventional Commits convention (feat, fix,
refactor, chore, docs, style, test, perf, build, ci), and each bullet
point is a concise, technical summary of one meaningful change, written
the way an experienced senior developer would describe it in a commit
body. Group related edits into a single bullet when they serve the same
purpose. Do not restate the full diffs, only summarize their intent and
effect.

Example of the expected output format:
${COMMIT_FORMAT_EXAMPLE}`;
}





module.exports = {
	buildCommitPrompt,
};