import * as core from "@actions/core";
import { context } from "@actions/github";
import { WebhookPayloadPullRequest } from "@octokit/webhooks";
import { HttpClient } from "@actions/http-client";
import {
  CLUBHOUSE_STORY_URL_REGEXP,
  getClubhouseURLFromPullRequest,
  createClubhouseStory,
  addCommentToPullRequest,
} from "./util";

async function run(): Promise<void> {
  if (context.eventName !== "pull_request") {
    core.setFailed("This action only works with `pull_request` events");
    return;
  }

  const payload = context.payload as WebhookPayloadPullRequest;
  const clubhouseURL = await getClubhouseURLFromPullRequest(payload);
  if (clubhouseURL) {
    const match = clubhouseURL.match(CLUBHOUSE_STORY_URL_REGEXP);
    if (match) {
      const storyId = match[1];
      core.setOutput("story-id", storyId);
    }
    return;
  }

  const http = new HttpClient();
  const story = await createClubhouseStory(payload, http);
  if (!story) {
    return;
  }
  core.setOutput("story-id", story.id.toString());
  const comment = `Clubhouse story: ${story.app_url}`;
  await addCommentToPullRequest(payload, comment);
}

run();
