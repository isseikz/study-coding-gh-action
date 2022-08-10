const core = require('@actions/core');
const github = require('@actions/github');
const util = require('node:util');
const exec = util.promisify(require("child_process").exec);
const fs = require('fs');

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore/lite');


try {
    main();
} catch (error) {
    core.setFailed(error.message);
}


async function main() {
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    // console.log(`The event payload: ${payload}`);
    const owner = github.context.payload.repository.owner.login;
    const repository = github.context.payload.repository.name;
    const cloneUrl = github.context.payload.repository.clone_url;

    const githubToken = core.getInput('github-token').trim();
    const octokit = github.getOctokit(githubToken);

    const latestTasks = await getLatestTasks();
    const pullRequests = await getPullRequests(octokit, owner, repository);
    const removedPRs = await filterSolvedTasks(latestTasks, pullRequests);
    const appendedTasks = await filterNewTasks(latestTasks, pullRequests);
    // removedPRs.forEach(pr => closePullRequest(pr));

    await initializeGit('study-coding', 'mail@example.com');
    for (const task of appendedTasks) {
        const branchName = await createBranchWithPatch(task.id, task.data.patch);
        await pushBranch(branchName);
        openPullRequest(octokit, owner, repository, branchName, task.data.sha, "body");
    }
}

async function getLatestTasks() {
    const firebaseConfig = {
        apiKey: process.env.API_KEY,
        authDomain: process.env.AUTH_DOMAIN,
        projectId: process.env.PROJECT_ID,
        storageBucket: process.env.STORAGE_BUCKET,
        messagingSenderId: process.env.MESSAGING_SENDER_ID,
        appId: process.env.APP_ID
    };
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const commitsCol = collection(db, 'simplified-commit');
    const commitsSnapshot = await getDocs(commitsCol);
    const commits = commitsSnapshot.docs.map(doc => {
        return {
            id: doc.id,
            data: doc.data()
        }
    });
    return commits;
}

async function getPullRequests(octokit, owner, repository) {
    console.log(`getPullRequests ${owner}/${repository}`);
    return await octokit.rest.pulls
        .list({
            owner: owner,
            repo: repository
        });
}

async function filterSolvedTasks(latestTasks, pullRequests) {

    return [];
}

async function filterNewTasks(latestTasks, pullRequests) {
    return latestTasks;
}

async function closePullRequest() {

}

async function initializeGit(name, email) {
    await exec(`git config --global user.name ${name}`);
    await exec(`git config --global user.email ${email}`);
}

async function createBranchWithPatch(id, patch) {
    const branchName = `test/${id}`;
    await exec(`git checkout -b ${branchName}`);
    const replacedPatch = patch
    console.log(replacedPatch);
    fs.writeFileSync("../diff.patch", replacedPatch);
    await exec(`git apply --stat --ignore-space-change --ignore-whitespace ../diff.patch`);
    await exec(`git add . `);
    await exec(`git commit -m "Test"`);
    return branchName;
}

async function pushBranch(branchName) {
    await exec(`git push -u origin ${branchName}`);
}

async function openPullRequest(octokit, owner, repository, branchName, prTitle, prBody) {
    await octokit.rest.pulls
        .create({
            owner: owner,
            repo: repository,
            head: branchName,
            base: 'main',
            title: prTitle,
            body: prBody
        });
}

async function openIssue(octokit, owner, repository, branchName, prTitle, prBody) {
    await octokit.rest.issues
        .create({
            owner: owner,
            repo: repository,
            title: prTitle,
            body: prBody
        });
}
