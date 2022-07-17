#!/bin/sh
TXT_CYAN='\e[1;36m ' && TXT_CLEAR='\e[1;0m ' && TXT_RED='\e[1;31m ' && TXT_GREEN='\e[1;32m '

PACKAGE_VERSION=$(cat api/package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

echo "package.json version: $PACKAGE_VERSION"

SOURCE_BRANCH=$(echo "${CI_COMMIT_TITLE}" | cut -d\' -f2)
echo "MR source branch: $SOURCE_BRANCH"

create_release()
{
    # replace ASCII newline characters wth json and markdown-compatible
    DESCRIPTION=$( sed 's/$/\\n/' changelog.txt | tr -d '\n' )

    # create release against tag
    echo "Adding release with note $DESCRIPTION"
    BODY="{
        \"tag_name\": \"$PACKAGE_VERSION\",
        \"description\": \"$DESCRIPTION\"
    }";
    POST_RELEASE_URL="https://gitlab.com/api/v4/projects/$CI_PROJECT_ID/releases"
    curl -X POST -i $POST_RELEASE_URL \
        -H "PRIVATE-TOKEN:$PRIVATE_TOKEN" \
        -H "Content-type: application/json" \
        -d "$BODY";
    sleep 5s

    #check release has been created with changelog as description
    GET_RELEASE_URL="https://gitlab.com/api/v4/projects/$CI_PROJECT_ID/releases/$PACKAGE_VERSION"
    if [ "$(curl -H "PRIVATE-TOKEN:$PRIVATE_TOKEN" $GET_RELEASE_URL  | grep $DESCRIPTION)" ] ; then
        echo -e "${TXT_GREEN} Release created with changelog"
    else    
        echo -e "${TXT_RED} Failed to create a release. Proceed manually.";
    fi
}

create_tag()
{
    echo "Creating tag $PACKAGE_VERSION against commit $CI_COMMIT_SHA"
    POST_TAG_URL="https://gitlab.com/api/v4/projects/$CI_PROJECT_ID/repository/tags?tag_name=$PACKAGE_VERSION&ref=$CI_COMMIT_SHA"
    curl -X POST -k -H "PRIVATE-TOKEN:$PRIVATE_TOKEN" $POST_TAG_URL 
    sleep 5s
    GET_TAG_URL="https://gitlab.com/api/v4/projects/$CI_PROJECT_ID/repository/tags/$PACKAGE_VERSION"
    if [ "$(curl --show-error -k -H "PRIVATE-TOKEN:$PRIVATE_TOKEN" $GET_TAG_URL  | grep $CI_COMMIT_SHA)" ] ; then
        echo -e "${TXT_GREEN} Tag $PACKAGE_VERSION created!"
        create_release
    else    
        echo -e "${TXT_RED} Failed to create release tag. Please create one manually." && exit 1;
    fi
}

# Verify release branch name matches package.json version
if [[ "$CI_COMMIT_TITLE" =~ $PACKAGE_VERSION ]]
then
    echo "Branch name version matches package.json version."
    create_tag
else
    echo "${TXT_RED} Branch name version does not match the package.json version."
    echo "${TXT_RED} The release tag was not created. Please fix versioning and proceed manually (Skipped jobs: create_release_tag, post_to_release_channel and create_backmerge_MR)." && exit 1;
fi
