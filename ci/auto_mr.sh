#!/bin/sh

TARGET_BRANCH="develop"
SOURCE_BRANCH="master"

# Extract the branch-name of the current release
# SOURCE_BRANCH=$(echo "${CI_COMMIT_TITLE}" | cut -d\' -f2)
# echo "Source branch set to release branch: $SOURCE_BRANCH"

BODY="{
    \"id\": $CI_PROJECT_ID,
    \"source_branch\": \"$SOURCE_BRANCH\",
    \"target_branch\": \"$TARGET_BRANCH\",
    \"title\": \"Back-merge following release \",
    \"description\": \"This is an automated back-merge MR following a production release. It merges changes made on the release branch back into \`develop\`\",
    \"allow_collaboration\": false,
    \"remove_source_branch\": false,
    \"merge_when_pipeline_succeeds\": true,
    \"auto_merge_strategy\": \"merge_when_pipeline_succeeds\",
    \"squash\": false
}";

echo "Body: $BODY"
echo "POSTING to: https://gitlab.com/api/v4/projects/$CI_PROJECT_ID/merge_requests"

curl -X POST -i "https://gitlab.com/api/v4/projects/$CI_PROJECT_ID/merge_requests" \
        --header "PRIVATE-TOKEN:$PRIVATE_TOKEN" \
        --header "Content-Type:application/json" \
        -d "$BODY";

echo "Opened a new merge request from $SOURCE_BRANCH to $TARGET_BRANCH";
exit;
