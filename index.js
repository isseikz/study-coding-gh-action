const core = require('@actions/core');
const github = require('@actions/github');
const util = require('node:util');
const exec = util.promisify(require("child_process").exec);

const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');


try {
    main();
} catch (error) {
    core.setFailed(error.message);
}


async function main() {
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    console.log(`The event payload: ${payload}`);

    const githubToken = core.getInput('github-token').trim();
    const octokit = github.getOctokit(githubToken);

    const latestTasks = await getLatestTasks();
    const pullRequests = await getPullRequests();
    const removedPRs = await filterSolvedTasks(latestTasks, pullRequests);
    const appendedPRs = await filterNewTasks(latestTasks, pullRequests);
    removedPRs.forEach(pr => closePullRequest(pr));
    appendedPRs.forEach(pr => openPullRequest(pr));
}

async function getLatestTasks() {
    initializeApp();
    const db = getFirestore();
    const snapshot = await db.collection('users').get();
    snapshot.forEach((doc) => {
        console.log(doc.id, '=>', doc.data());
    });
}

async function getPullRequests() {

}

async function filterSolvedTasks() {
    return [];
}

async function filterNewTasks() {
    return [];
}

async function closePullRequest() {

}

async function openPullRequest() {

}
