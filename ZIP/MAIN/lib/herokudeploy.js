import __import0 from "axios";
const axios = __import0;

async function deployHeroku({ apiKey, appName, githubUser, githubRepo, githubToken }) {
  try {
    // 1. Create App
    const app = await axios.post(
      "https://api.heroku.com/apps",
      { name: appName, region: "us" },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/vnd.heroku+json; version=3",
        },
      }
    );

    const appId = app.data.id;

    // 2. Connect GitHub
    await axios.post(
      "https://api.heroku.com/account/github",
      { github_token: githubToken },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/vnd.heroku+json; version=3",
        },
      }
    );

    // 3. Link Repo
    await axios.post(
      `https://api.heroku.com/apps/${appId}/github`,
      { repo: `${githubUser}/${githubRepo}` },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/vnd.heroku+json; version=3",
        },
      }
    );

    // 4. Enable Auto Deploy
    await axios.patch(
      `https://api.heroku.com/apps/${appId}/github`,
      { auto_deploy: true },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/vnd.heroku+json; version=3",
        },
      }
    );

    return {
      status: true,
      app: appName,
      url: `https://${appName}.herokuapp.com`,
    };
  } catch (e) {
    return {
      status: false,
      error: e.response?.data || e.message,
    };
  }
}

export default { deployHeroku };