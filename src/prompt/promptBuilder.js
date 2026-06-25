// src/prompt/promptBuilder.js
const path = require('path');
const UtreeManager = require('../dependency/utreeManager');
const { buildMasterPrompt } = require('./promptTemplate');





const DEFAULT_PROJECT_TYPE = 'Visual Studio Code';

function buildExclusionArgs(selectedRelativePaths) {
	const names = new Set();

	for (const relativePath of selectedRelativePaths) {
		const leafName = path.basename(relativePath);
		if (leafName) {
			names.add(leafName);
		}
	}

	return Array.from(names);
}

class PromptBuilder {
	constructor(workspaceRootPath) {
		this.workspaceRootPath = workspaceRootPath;
		this.utreeManager = UtreeManager.getInstance();
	}

	async build(userRequestedChanges, selectedRelativePaths) {
		await this.utreeManager.ensureAvailable();

		const exclusionArgs = buildExclusionArgs(selectedRelativePaths);

		const treeOutput = await this.utreeManager.runTree(this.workspaceRootPath, exclusionArgs);
		const rawDumpOutput = await this.utreeManager.runDump(this.workspaceRootPath, exclusionArgs);

		const masterPrompt = buildMasterPrompt(DEFAULT_PROJECT_TYPE, userRequestedChanges);

		return `${treeOutput}\n\n${rawDumpOutput}\n\n${masterPrompt}`;
	}
}

module.exports = PromptBuilder;