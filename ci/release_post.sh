#!/bin/sh

TEXT=$( awk 'NF{print $0 " \n"}' changelog.txt)
NEW_VERSION=$(curl -Ss --request GET --header "PRIVATE-TOKEN:$PRIVATE_TOKEN" "https://gitlab.com/api/v4/projects/${CI_PROJECT_ID}/repository/tags" | jq -r '.[0] | .name')

BODY="{
    \"@type\": \"MessageCard\",
    \"themeColor\": \"2AA9E1\",
    \"title\": \"Data Cleanse API v$NEW_VERSION\",
    \"text\": \"$TEXT\"
}";

curl -X POST -i "$WEBHOOK" \
        -H "Accept: application/json" \
        -H "Content-type: application/json" \
        -d "$BODY";

exit;
