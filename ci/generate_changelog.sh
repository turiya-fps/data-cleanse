# Generates a list of names of all feature-branches which have been merged into develop since the last release
# Works only for merge commits like the following: CI_COMMIT_TITLE="Merge branch 'release/x.x.x' into 'master'"
# Works only if GitFlow has been strictly followed

TXT_CYAN='\e[1;36m ' && TXT_CLEAR='\e[1;0m ' && TXT_RED='\e[1;31m ' && TXT_GREEN='\e[1;32m '

MERGE_REQUEST_IID=`cat merge_request_iid.txt`
echo "CI_MERGE_REQUEST_IID of merged MR (from cache): " ${MERGE_REQUEST_IID}
echo -e "${TXT_CYAN} Generating release changelog as a downloadable artifact..."
# SOURCE_BRANCH=$(echo "${CI_COMMIT_TITLE}" | cut -d\' -f2)
URL="https://gitlab.com/api/v4/projects/$CI_PROJECT_ID/merge_requests/$MERGE_REQUEST_IID/commits"
MERGE_COMMITS=$( curl -H "PRIVATE-TOKEN:$PRIVATE_TOKEN" -H "Content-Type: application/json" $URL | jq -c '.[] | select( .message | test("feature/")) | select( .message | test("Merge branch")) | .message' )
BULLET_LIST=$( echo $MERGE_COMMITS | grep -o 'feature\/[a-z0-9-]*' | sed -r 's/feature\///' | sed 's/-/ /g' | sed -e 's/^/- /' )
echo -e "$BULLET_LIST" > changelog.txt