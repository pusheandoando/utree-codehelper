// src/tree/projectFileScanner.js
const fs = require('fs');
const path = require('path');

const IGNORED_DIRS = new Set(['.git', 'node_modules', '.vscode', 'dist', 'out', '.vscode-test']);





function listDirectoryEntries(absoluteDirectoryPath) {
	const entries = fs.readdirSync(absoluteDirectoryPath, { withFileTypes: true });

	return entries
		.sort((a, b) => {
			if (a.isDirectory() !== b.isDirectory()) {
				return a.isDirectory() ? -1 : 1;
			}
			return a.name.localeCompare(b.name);
		})
		.map((entry) => ({
			name: entry.name,
			isDirectory: entry.isDirectory(),
			absolutePath: path.join(absoluteDirectoryPath, entry.name),
		}));
}

function collectAllEntries(rootPath) {
	const results = [];

	function walk(absoluteDir) {
		let entries;
		try {
			entries = fs.readdirSync(absoluteDir, { withFileTypes: true });
		} catch {
			return;
		}

		for (const entry of entries) {
			if (IGNORED_DIRS.has(entry.name)) {
				continue;
			}
			const absolutePath = path.join(absoluteDir, entry.name);
			const relativePath = path.relative(rootPath, absolutePath);
			results.push(relativePath);
			if (entry.isDirectory()) {
				walk(absolutePath);
			}
		}
	}

	walk(rootPath);
	return results;
}

module.exports = {
	listDirectoryEntries,
	collectAllEntries,
};