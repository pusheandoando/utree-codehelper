// src/prompt/promptBuilder.js
const path = require('path');
const UtreeManager = require('../dependency/utreeManager');
const { buildMasterPrompt } = require('./promptTemplate');





const DEFAULT_PROJECT_TYPE = 'Visual Studio Code extension (Node.js, CommonJS)';

function buildExclusionArgs(excludedRelativePaths) {
	const topLevelNames = new Set();

	for (const relativePath of excludedRelativePaths) {
		const topLevel = relativePath.split(path.sep)[0].split('/')[0];
		if (topLevel) {
			topLevelNames.add(topLevel);
		}
	}

	return Array.from(topLevelNames);
}

function filterDumpOutput(dumpOutput, excludedRelativePaths) {
	if (excludedRelativePaths.length === 0) {
		return dumpOutput;
	}

	const normalizedExcluded = new Set(
		excludedRelativePaths.map((p) => p.split(path.sep).join('/'))
	);

	const blocks = dumpOutput.split(/(?=\n[^\n]+:\n-{20})/);

	const filteredBlocks = blocks.filter((block) => {
		const headerMatch = block.match(/\n?([^\n]+):\n-{20}/);
		if (!headerMatch) {
			return true;
		}
		const filePath = headerMatch[1].trim();
		return !normalizedExcluded.has(filePath);
	});

	return filteredBlocks.join('');
}

class PromptBuilder {
	constructor(workspaceRootPath) {
		this.workspaceRootPath = workspaceRootPath;
		this.utreeManager = UtreeManager.getInstance();
	}

	async build(userRequestedChanges, excludedRelativePaths) {
		await this.utreeManager.ensureAvailable();

		const topLevelExclusions = buildExclusionArgs(excludedRelativePaths);

		const treeOutput = await this.utreeManager.runTree(this.workspaceRootPath, topLevelExclusions);
		const rawDumpOutput = await this.utreeManager.runDump(this.workspaceRootPath, topLevelExclusions);
		const dumpOutput = filterDumpOutput(rawDumpOutput, excludedRelativePaths);

		const masterPrompt = buildMasterPrompt(DEFAULT_PROJECT_TYPE, userRequestedChanges);

		return `${treeOutput}\n\n${dumpOutput}\n\n${masterPrompt}`;
	}
}

module.exports = PromptBuilder;