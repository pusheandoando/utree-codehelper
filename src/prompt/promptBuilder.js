// src/prompt/promptBuilder.js
const path = require('path');

const UtreeManager = require('../dependency/utreeManager');
const { buildMasterPrompt } = require('./promptTemplate');





const DEFAULT_PROJECT_TYPE = 'Visual Studio Code';





function isCoveredByAncestor(normalizedPath, normalizedExcludedSet) {
	const segments = normalizedPath.split('/');

	for (let i = 1; i < segments.length; i++) {
		const ancestor = segments.slice(0, i).join('/');
		
		if (normalizedExcludedSet.has(ancestor)) {
			return true;
		}
	}

	return false;
}

function findRootExclusions(excludedRelativePaths) {
	const normalizedPaths = excludedRelativePaths.map((p) => p.replace(/\\/g, '/'));
	const normalizedSet = new Set(normalizedPaths);

	return normalizedPaths.filter((normalizedPath) => !isCoveredByAncestor(normalizedPath, normalizedSet));
}

function buildExclusionNames(excludedRelativePaths) {
	const rootExclusions = findRootExclusions(excludedRelativePaths);
	const names = new Set();

	for (const normalizedPath of rootExclusions) {
		const leaf = path.basename(normalizedPath);
		if (leaf) {
			names.add(leaf);
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

		const exclusionArgs = buildExclusionNames(selectedRelativePaths);

		const treeOutput = await this.utreeManager.runTree(this.workspaceRootPath, exclusionArgs);
		const dumpOutput = await this.utreeManager.runDump(this.workspaceRootPath, exclusionArgs);

		const masterPrompt = buildMasterPrompt(DEFAULT_PROJECT_TYPE, userRequestedChanges);

		return `${treeOutput}\n\n${dumpOutput}\n\n${masterPrompt}`;
	}
}





module.exports = PromptBuilder;