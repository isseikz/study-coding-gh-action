const core = require('@actions/core');
const github = require('@actions/github');
const util = require('node:util');
const exec = util.promisify(require("child_process").exec);

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore/lite');


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
    const commits = commitsSnapshot.docs.map(doc => doc.data());
    return commits;
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
