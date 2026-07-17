// src/dependency/utreeManager.js
const os = require('os');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawn } = require('child_process');

const {
	STORAGE_FOLDER_NAME,
	BINARY_SUBFOLDER_NAME,
	BINARY_FILE_NAME,
	GITHUB_RELEASES_API_URL,
} = require('../core/constants');





let instance = null;

class UtreeManager {
	constructor() {
		this.storageRoot = path.join(os.homedir(), STORAGE_FOLDER_NAME);
		this.binaryFolder = path.join(this.storageRoot, BINARY_SUBFOLDER_NAME);
		this.binaryPath = path.join(this.binaryFolder, BINARY_FILE_NAME);
	}

	static getInstance() {
		if (!instance) {
			instance = new UtreeManager();
		}

		return instance;
	}

	getBinaryPath() {
		return this.binaryPath;
	}

	async ensureAvailable() {
		if (this.isBinaryPresent()) {
			return this.binaryPath;
		}

		await this.downloadLatestBinary();
		await this.makeExecutable();
		
		return this.binaryPath;
	}

	isBinaryPresent() {
		return fs.existsSync(this.binaryPath);
	}

	async downloadLatestBinary(onProgress) {
		fs.mkdirSync(this.binaryFolder, { recursive: true });
		
		const assetUrl = await this.resolveBinaryAssetUrl();
		await this.downloadFile(assetUrl, this.binaryPath, onProgress);
	}

	resolveBinaryAssetUrl() {
		return new Promise((resolve, reject) => {
			const requestOptions = {
				headers: { 'User-Agent': 'utree-codehelper-vscode-extension' },
			};

			https.get(GITHUB_RELEASES_API_URL, requestOptions, (response) => {
				if (response.statusCode !== 200) {
					reject(new Error(`GitHub API responded with status ${response.statusCode}`));
					return;
				}

				let rawBody = '';
				response.on('data', (chunk) => { rawBody += chunk; });
				response.on('end', () => {
					try {
						const releaseData = JSON.parse(rawBody);
						const binaryAsset = releaseData.assets.find((asset) => asset.name === BINARY_FILE_NAME);
						
						if (!binaryAsset) {
							reject(new Error('Could not find the utree binary asset in the latest release'));
							return;
						}

						resolve(binaryAsset.browser_download_url);
					} catch (parseError) {
						reject(parseError);
					}
				});
			}).on('error', reject);
		});
	}

	downloadFile(fileUrl, destinationPath, onProgress) {
		return new Promise((resolve, reject) => {
			const requestOptions = {
				headers: { 'User-Agent': 'utree-codehelper-vscode-extension' },
			};

			https.get(fileUrl, requestOptions, (response) => {
				if (response.statusCode === 302 || response.statusCode === 301) {
					this.downloadFile(response.headers.location, destinationPath, onProgress).then(resolve, reject);
					return;
				}

				if (response.statusCode !== 200) {
					reject(new Error(`Failed to download binary, status ${response.statusCode}`));
					return;
				}

				const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
				let receivedBytes = 0;

				const fileStream = fs.createWriteStream(destinationPath);

				response.on('data', (chunk) => {
					receivedBytes += chunk.length;
					
					if (onProgress && totalBytes > 0) {
						const percent = Math.round((receivedBytes / totalBytes) * 100);
						onProgress(percent);
					}
				});

				response.pipe(fileStream);
				fileStream.on('finish', () => fileStream.close(resolve));
				fileStream.on('error', reject);
			}).on('error', reject);
		});
	}

	makeExecutable() {
		return new Promise((resolve, reject) => {
			fs.chmod(this.binaryPath, 0o755, (error) => {
				if (error) {
					reject(error);
					return;
				}

				resolve();
			});
		});
	}

	spawnAndCollect(args) {
		return new Promise((resolve, reject) => {
			const chunks = [];
			const child = spawn(this.binaryPath, args);

			child.stdout.on('data', (chunk) => { chunks.push(chunk); });
			child.stderr.on('data', (chunk) => { chunks.push(chunk); });

			child.on('error', reject);

			child.on('close', (code) => {
				const output = Buffer.concat(chunks).toString('utf8');
				
				if (code !== 0) {
					reject(new Error(output || `utree exited with code ${code}`));
					return;
				}

				resolve(output);
			});
		});
	}

	spawnAndCollectInDir(args, cwd) {
		return new Promise((resolve, reject) => {
			const chunks = [];
			const child = spawn(this.binaryPath, args, { cwd });

			child.stdout.on('data', (chunk) => { chunks.push(chunk); });
			child.stderr.on('data', (chunk) => { chunks.push(chunk); });

			child.on('error', reject);

			child.on('close', (code) => {
				const output = Buffer.concat(chunks).toString('utf8');
				
				if (code !== 0) {
					reject(new Error(output || `utree exited with code ${code}`));
					return;
				}

				resolve(output);
			});
		});
	}

	runDump(projectRootPath, excludedNames) {
		const args = ['.', '--dump=numbered'];

		if (excludedNames && excludedNames.length > 0) {
			args.push('-e', excludedNames.join(','));
		}

		return this.spawnAndCollectInDir(args, projectRootPath);
	}

	runTree(projectRootPath, excludedNames) {
		const args = ['.'];

		if (excludedNames && excludedNames.length > 0) {
			args.push('-e', excludedNames.join(','));
		}

		return this.spawnAndCollectInDir(args, projectRootPath);
	}
}





module.exports = UtreeManager;