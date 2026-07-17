// src/parser/changeValidator.js
const { COMMAND_TYPE } = require('./commandParser');





async function findUnapplicableCommands(changeApplier, commands) {
	const unapplicableCommands = [];

	for (const command of commands) {
		if (command.parseError) {
			unapplicableCommands.push({ command, reason: command.parseError });
			continue;
		}

		const validationError = await changeApplier.validate(command);
		if (validationError) {
			unapplicableCommands.push({ command, reason: validationError });
		}
	}

	return unapplicableCommands;
}

async function attachOldContent(changeApplier, commands) {
	for (const command of commands) {
		if (command.parseError || command.type !== COMMAND_TYPE.REPLACE_LINES) {
			continue;
		}

		if (command.oldContent !== undefined) {
			continue;
		}

		try {
			command.oldContent = await changeApplier.readOldContent(command);
		} catch {
			command.oldContent = null;
		}
	}
}





module.exports = {
	findUnapplicableCommands,
	attachOldContent,
};