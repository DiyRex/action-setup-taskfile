import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as github from '@actions/github';
import * as exec from '@actions/exec';
import * as path from 'path';
import * as os from 'os';

const TOOL_NAME = 'task';
const REPO_OWNER = 'go-task';
const REPO_NAME = 'task';

interface PlatformInfo {
  os: string;
  arch: string;
  ext: string;
}

function getPlatformInfo(): PlatformInfo {
  const platform = os.platform();
  const arch = os.arch();

  let taskOs: string;
  let taskArch: string;
  let ext: string;

  // Map Node.js platform to Taskfile platform names
  switch (platform) {
    case 'linux':
      taskOs = 'linux';
      ext = 'tar.gz';
      break;
    case 'darwin':
      taskOs = 'darwin';
      ext = 'tar.gz';
      break;
    case 'win32':
      taskOs = 'windows';
      ext = 'zip';
      break;
    case 'freebsd':
      taskOs = 'freebsd';
      ext = 'tar.gz';
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }

  // Map Node.js arch to Taskfile arch names
  switch (arch) {
    case 'x64':
      taskArch = 'amd64';
      break;
    case 'arm64':
      taskArch = 'arm64';
      break;
    case 'arm':
      taskArch = 'arm';
      break;
    case 'ia32':
      taskArch = '386';
      break;
    default:
      throw new Error(`Unsupported architecture: ${arch}`);
  }

  return { os: taskOs, arch: taskArch, ext };
}

async function getLatestVersion(token: string): Promise<string> {
  const octokit = github.getOctokit(token);

  try {
    const { data: release } = await octokit.rest.repos.getLatestRelease({
      owner: REPO_OWNER,
      repo: REPO_NAME,
    });

    // Remove 'v' prefix if present
    return release.tag_name.replace(/^v/, '');
  } catch (error) {
    throw new Error(`Failed to fetch latest version: ${error}`);
  }
}

function normalizeVersion(version: string): string {
  // Remove 'v' prefix if present
  return version.replace(/^v/, '');
}

function getDownloadUrl(version: string, platformInfo: PlatformInfo): string {
  const { os: taskOs, arch: taskArch, ext } = platformInfo;
  return `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/v${version}/task_${taskOs}_${taskArch}.${ext}`;
}

async function downloadAndExtract(
  url: string,
  version: string,
  platformInfo: PlatformInfo
): Promise<string> {
  core.info(`Downloading Taskfile from ${url}`);

  const downloadPath = await tc.downloadTool(url);

  let extractedPath: string;
  if (platformInfo.ext === 'zip') {
    extractedPath = await tc.extractZip(downloadPath);
  } else {
    extractedPath = await tc.extractTar(downloadPath);
  }

  // Cache the extracted tool
  const cachedPath = await tc.cacheDir(extractedPath, TOOL_NAME, version);

  return cachedPath;
}

async function verifyInstallation(): Promise<void> {
  let output = '';

  await exec.exec('task', ['--version'], {
    listeners: {
      stdout: (data: Buffer) => {
        output += data.toString();
      },
    },
  });

  core.info(`Taskfile installed: ${output.trim()}`);
}

async function run(): Promise<void> {
  try {
    const versionInput = core.getInput('version') || 'latest';
    const token = core.getInput('github-token');

    const platformInfo = getPlatformInfo();
    core.info(`Detected platform: ${platformInfo.os}/${platformInfo.arch}`);

    // Resolve version
    let version: string;
    if (versionInput.toLowerCase() === 'latest') {
      core.info('Fetching latest version...');
      version = await getLatestVersion(token);
      core.info(`Latest version: ${version}`);
    } else {
      version = normalizeVersion(versionInput);
    }

    // Check tool cache first
    let toolPath = tc.find(TOOL_NAME, version);
    let cacheHit = false;

    if (toolPath) {
      core.info(`Found Taskfile ${version} in tool cache`);
      cacheHit = true;
    } else {
      core.info(`Taskfile ${version} not found in cache, downloading...`);
      const downloadUrl = getDownloadUrl(version, platformInfo);
      toolPath = await downloadAndExtract(downloadUrl, version, platformInfo);
    }

    // Add to PATH
    core.addPath(toolPath);
    core.info(`Added ${toolPath} to PATH`);

    // Verify installation
    await verifyInstallation();

    // Set outputs
    core.setOutput('version', version);
    core.setOutput('cache-hit', cacheHit.toString());

    core.info(`Successfully setup Taskfile v${version}`);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unexpected error occurred');
    }
  }
}

run();
