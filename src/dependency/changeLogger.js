// src/dependency/changeLogger.js
const fs = require('fs');
const path = require('path');
const os = require('os');
const { STORAGE_FOLDER_NAME } = require('../core/constants');





const LOGS_SUBFOLDER = 'logs';

function sanitizeProjectName(workspaceRootPath) {
	return path.basename(workspaceRootPath).replace(/[^a-zA-Z0-9_\-\.]/g, '_');
}

function logsFolder(workspaceRootPath) {
	const projectName = sanitizeProjectName(workspaceRootPath);
	return path.join(os.homedir(), STORAGE_FOLDER_NAME, LOGS_SUBFOLDER, projectName);
}

function formatDatetimeForFilename(date) {
	const pad = (n) => String(n).padStart(2, '0');
	return (
		date.getFullYear() +
		pad(date.getMonth() + 1) +
		pad(date.getDate()) +
		'_' +
		pad(date.getHours()) +
		pad(date.getMinutes()) +
		pad(date.getSeconds())
	);
}

function formatDatetimeForDisplay(date) {
	return date.toLocaleString();
}

function saveSession(workspaceRootPath, commands) {
	const folder = logsFolder(workspaceRootPath);
	fs.mkdirSync(folder, { recursive: true });

	const now = new Date();
	const filename = `RC_${formatDatetimeForFilename(now)}.json`;
	const filePath = path.join(folder, filename);

	const entry = {
		datetime: now.toISOString(),
		commands,
	};

	fs.writeFileSync(filePath, JSON.stringify(entry, null, 2), 'utf8');
	return filePath;
}

function listSessions(workspaceRootPath) {
	const folder = logsFolder(workspaceRootPath);

	if (!fs.existsSync(folder)) {
		return [];
	}

	const files = fs.readdirSync(folder)
		.filter((f) => f.startsWith('RC_') && f.endsWith('.json'))
		.sort()
		.reverse();

	return files.map((filename) => {
		const filePath = path.join(folder, filename);
		try {
			const raw = fs.readFileSync(filePath, 'utf8');
			const entry = JSON.parse(raw);
			return {
				filename,
				filePath,
				datetime: new Date(entry.datetime),
				commands: entry.commands,
			};
		} catch {
			return null;
		}
	}).filter(Boolean);
}

function clearSessions(workspaceRootPath) {
	const folder = logsFolder(workspaceRootPath);

	if (!fs.existsSync(folder)) {
		return;
	}

	const files = fs.readdirSync(folder)
		.filter((f) => f.startsWith('RC_') && f.endsWith('.json'));

	for (const file of files) {
		fs.unlinkSync(path.join(folder, file));
	}
}

module.exports = {
	saveSession,
	listSessions,
	clearSessions,
	formatDatetimeForDisplay,
};