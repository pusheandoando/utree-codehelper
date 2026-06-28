// src/prompt/promptBuilder.js
const path = require('path');
const { collectAllEntries } = require('../tree/projectFileScanner');
const UtreeManager = require('../dependency/utreeManager');
const { buildMasterPrompt } = require('./promptTemplate');





const DEFAULT_PROJECT_TYPE = 'Visual Studio Code';

const DUMP_BLOCK_SEPARATOR = '\n\n\n\n\n';
const DUMP_HEADER_SUFFIX = ':\n--------------------\n';

function buildSafeExclusionArgs(workspaceRootPath, excludedRelativePaths) {
	const excludedSet = new Set(
		excludedRelativePaths.map((p) => p.replace(/\\/g, '/'))
	);

	const allEntries = collectAllEntries(workspaceRootPath);

	const leafFrequency = new Map();
	for (const relativePath of allEntries) {
		const leaf = path.basename(relativePath);
		leafFrequency.set(leaf, (leafFrequency.get(leaf) || 0) + 1);
	}

	const safeNames = new Set();
	for (const relativePath of excludedRelativePaths) {
		const normalized = relativePath.replace(/\\/g, '/');
		if (!excludedSet.has(normalized)) {
			continue;
		}
		const leaf = path.basename(relativePath);
		if (leaf && leafFrequency.get(leaf) === 1) {
			safeNames.add(leaf);
		}
	}

	return Array.from(safeNames);
}

function filterDumpOutput(rawDump, excludedRelativePaths) {
	if (excludedRelativePaths.length === 0) {
		return rawDump;
	}

	const excludedSet = new Set(
		excludedRelativePaths.map((p) => p.replace(/\\/g, '/'))
	);

	const blocks = rawDump.split(DUMP_BLOCK_SEPARATOR);
	const kept = [];

	for (const block of blocks) {
		const headerEnd = block.indexOf(DUMP_HEADER_SUFFIX);
		if (headerEnd === -1) {
			kept.push(block);
			continue;
		}

		const rawHeader = block.slice(0, headerEnd);
		const normalizedHeader = rawHeader.replace(/\\/g, '/').trim();

		if (excludedSet.has(normalizedHeader)) {
			continue;
		}

		kept.push(block);
	}

	return kept.join(DUMP_BLOCK_SEPARATOR);
}

class PromptBuilder {
	constructor(workspaceRootPath) {
		this.workspaceRootPath = workspaceRootPath;
		this.utreeManager = UtreeManager.getInstance();
	}

	async build(userRequestedChanges, selectedRelativePaths) {
		await this.utreeManager.ensureAvailable();

		const exclusionArgs = buildSafeExclusionArgs(this.workspaceRootPath, selectedRelativePaths);

		const treeOutput = await this.utreeManager.runTree(this.workspaceRootPath, exclusionArgs);
		const rawDumpOutput = await this.utreeManager.runDump(this.workspaceRootPath, exclusionArgs);
		const filteredDump = filterDumpOutput(rawDumpOutput, selectedRelativePaths);

		const masterPrompt = buildMasterPrompt(DEFAULT_PROJECT_TYPE, userRequestedChanges);

		return `${treeOutput}\n\n${filteredDump}\n\n${masterPrompt}`;
	}
}

module.exports = PromptBuilder;