import { Octokit } from "@octokit/core";
import fs from 'fs';
import path from 'path';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY?.split('/')[1];
const OWNER = process.env.GITHUB_REPOSITORY?.split('/')[0];
const PR_NUMBER = process.env.PR_NUMBER;

if (!GITHUB_TOKEN || !REPO || !OWNER || !PR_NUMBER) {
    console.error("Missing required environment variables.");
    process.exit(1);
} 
// Getting changed files in the pull request
async function getFiles(){
    const octokit = new Octokit({
        auth: GITHUB_TOKEN
    })
    const files = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/files', {
        owner: OWNER,
        repo: REPO,
        pull_number: PR_NUMBER,
        headers: {
        'X-GitHub-Api-Version': '2022-11-28'
        },
        per_page: 100
    })
    return files.data.filter(file => file.status !== "removed").map(file => file.filename);
}
// Analizing files for internal word
function searchInternalKeyword(changedFiles) {
    // we only search in .ts or .js files here
    const relevantFiles = changedFiles.filter(file => file.endsWith('.ts') || file.endsWith('.js'));
    // Skip private-internal-sdk.ts files
    const filteredFiles = relevantFiles.filter(file => !file.endsWith('private-internal-sdk.ts'));
    let internalEndpoints = [];
    if (filteredFiles.length === 0) {
        return internalEndpoints;
    }
    filteredFiles.forEach(filePath => {
        try {
            const absolutePath = path.resolve(filePath); 
            const content = fs.readFileSync(absolutePath, 'utf-8'); 
            const combinedExp = /internal\/[^?'`"]*[?'`"\s\n]/g;
            const endpointsFound = content.match(combinedExp);
            if (endpointsFound) {
                const uniqueEndpoints = Array.from(new Set(endpointsFound));
                internalEndpoints.push([filePath, uniqueEndpoints]);
            }
        } catch (error) {
            console.error(`Error reading file ${filePath}:`, error);
        }
    });
    // Since this endpoint is used only for testing, we are removing it from the list
    internalEndpoints = internalEndpoints.filter(([filePath, endpointList]) => {
        return endpointList.length > 1 || endpointList[0] !== "internal/snap-ins.system-update'";
    });

    // if the filepath now has no endpointList, we remove it from the list
    internalEndpoints = internalEndpoints.filter(([filePath, endpointList]) => {
        return endpointList.length > 0;
    });
    
    return internalEndpoints;
}

// Analizing files for tokens
function searchTokens(changedFiles) {
    // Skip private-internal-sdk.ts files
    const filteredFiles = changedFiles.filter(file => !file.endsWith('private-internal-sdk.ts'));
    let dangerFiles = [];
    const regexList = [
        // https://github.com/gitleaks/gitleaks/blob/master/config/gitleaks.toml
        // jwt token
        /\b(ey[a-zA-Z0-9]{17,}\.ey[a-zA-Z0-9\/\\_-]{17,}\.(?:[a-zA-Z0-9\/\\_-]{10,}={0,2})?)(?:['|\"|\n|\r|\s|\x60|;]|$)/g,
        // jwt base64 token
        /\bZXlK(?:(aGJHY2lPaU)|(aGNIVWlPaU)|(aGNIWWlPaU)|(aGRXUWlPaU)|(aU5qUWlP)|(amNtbDBJanBi)|(amRIa2lPaU)|(bGNHc2lPbn)|(bGJtTWlPaU)|(cWEzVWlPaU)|(cWQyc2lPb)|(cGMzTWlPaU)|(cGRpSTZJ)|(cmFXUWlP)|(clpYbGZiM0J6SWpwY)|(cmRIa2lPaUp)|(dWIyNWpaU0k2)|(d01tTWlP)|(d01uTWlPaU)|(d2NIUWlPaU)|(emRXSWlPaU)|(emRuUWlP)|(MFlXY2lPaU)|(MGVYQWlPaUp)|(MWNtd2l)|(MWMyVWlPaUp)|(MlpYSWlPaU)|(MlpYSnphVzl1SWpv)|(NElqb2)|(NE5XTWlP)|(NE5YUWlPaU)|(NE5YUWpVekkxTmlJNkl)|(NE5YVWlPaU)|(NmFYQWlPaU))[a-zA-Z0-9\/\\_+\-\r\n]{40,}={0,2}/g
    ];
    filteredFiles.forEach(filePath => {
        try {
            const absolutePath = path.resolve(filePath);
            const content = fs.readFileSync(absolutePath, 'utf-8');
            regexList.forEach(regex => {
                const matches = content.match(regex);
                if (matches) {
                    dangerFiles.push(filePath);
                }
            });
        } catch (error) {
            console.error(`Error reading file ${filePath}:`, error);
        }
    });
    return dangerFiles;
}

// Posting the comment in the PR - internal endpoints
async function postCommentInternal(endpoints) {
    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    let commentBody = `Hey! I noticed you are using the following internal endpoints:\n`;
    endpoints.forEach(([filePath, endpointList]) => {
        commentBody += `- ${filePath}:\n`;
        endpointList.forEach(endpoint => {
            commentBody += `  - ${endpoint}\n`;
        });
    });
    commentBody += `\nInternal endpoints shouldn't be used, please follow the steps on this document: https://docs.google.com/document/d/1AMwAvWqhR-6HYIF32iB2Ecjv3IfqqoQSXX1ObzcOk8E/edit?usp=sharing`;

    // Managing Github comment size limit
    if (commentBody.length > 60000) {
        console.log("Internal endpoints were found, but the comment is too long to post. Please check the PR for more details.");
        return;
    }

    await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
        owner: OWNER,
        repo: REPO,
        issue_number: PR_NUMBER,
        body: commentBody,
        headers: { 'X-GitHub-Api-Version': '2022-11-28' }
    });
}

// Posting the comment in the PR - tokens
async function postCommentTokens(files) {
    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    let commentBody = `There seem to be potential tokens in the following files:\n`;
    files.forEach((filepath) => {
        commentBody += `- ${filepath}\n`;
    });
    commentBody += `\nPlease make sure no hardcoded tokens are present in the snap-in.`;

    // Managing Github comment size limit
    if (commentBody.length > 60000) {
        console.log("Tokens were found, but the comment is too long to post. Please check the PR for more details.");
        return;
    }
    await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
        owner: OWNER,
        repo: REPO, 
        issue_number: PR_NUMBER,
        body: commentBody,
        headers: { 'X-GitHub-Api-Version': '2022-11-28' }
    });
}

// Main function
async function main() {
    try {
        const files = await getFiles();
        const internalEndpointFiles = searchInternalKeyword(files);
        const tokenFiles = searchTokens(files);
        if (internalEndpointFiles.length > 0 && tokenFiles.length > 0) {
            await postCommentInternal(internalEndpointFiles);
            await postCommentTokens(tokenFiles);
            process.exit(1);
        } else if(internalEndpointFiles.length > 0 && tokenFiles.length == 0) {
            await postCommentInternal(internalEndpointFiles);
            process.exit(1);
        } else if(internalEndpointFiles.length == 0 && tokenFiles.length > 0) {
            await postCommentTokens(tokenFiles);
            process.exit(1);
        } else {
            process.exit(0);
        }
    } catch (error) {
        console.error("Error in script execution:", error);
        process.exit(1);
    }
}

main();
