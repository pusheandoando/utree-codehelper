// src/dependency/exclusionCache.js
const os = require('os');
const fs = require('fs');
const path = require('path');

const { STORAGE_FOLDER_NAME } = require('../core/constants');





const CACHE_SUBFOLDER = 'cache';
const EXCLUSIONS_FILENAME = 'exclusions.json';





function sanitizeProjectName(workspaceRootPath) {
	return path.basename(workspaceRootPath).replace(/[^a-zA-Z0-9_\-\.]/g, '_');
}


function cacheFilePath(workspaceRootPath) {
	const projectName = sanitizeProjectName(workspaceRootPath);
	
	return path.join(os.homedir(), STORAGE_FOLDER_NAME, CACHE_SUBFOLDER, projectName, EXCLUSIONS_FILENAME);
}


function loadExclusions(workspaceRootPath) {
	const filePath = cacheFilePath(workspaceRootPath);
	
	try {
		const raw = fs.readFileSync(filePath, 'utf8');
		const parsed = JSON.parse(raw);
		
		if (Array.isArray(parsed)) {
			return parsed;
		}

		return [];
	} catch {
		return [];
	}
}


function saveExclusions(workspaceRootPath, excludedPaths) {
	const filePath = cacheFilePath(workspaceRootPath);
	
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, JSON.stringify(excludedPaths, null, 2), 'utf8');
}





module.exports = {
	loadExclusions,
	saveExclusions,
};