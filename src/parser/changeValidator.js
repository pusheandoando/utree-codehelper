// src/parser/changeValidator.js





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

module.exports = {
	findUnapplicableCommands,
};