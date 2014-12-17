#!/bin/sh -e

HELP_MESSAGE="Usage: release.sh release_file [release_name]"

if [ ! $1 ]
then
	echo >&2 "ERROR: No release file given."
	echo >&2 $HELP_MESSAGE
	false
fi

if [ $1 = '-h' ]
then
	echo >&2 $HELP_MESSAGE
	exit 0
fi

if [ ! -f $1 ]
then
	echo >&2 "ERROR: Release file '$1' does not exist."
	false
fi

RELEASE_ZIP=$1
GITHUB_TOKEN=~/.githubtoken

if [ ! -f $GITHUB_TOKEN ]
then
	echo >&2 "ERROR: No token found at $GITHUB_TOKEN"
	false
fi

if [ $(git rev-parse --abbrev-ref HEAD) != "master" ]
then
	echo >&2 "ERROR: Must release from master."
	false
fi

if [ $(git rev-parse @) != $(git rev-parse @{u}) ]
then
	echo >&2 "ERROR: Local HEAD and upstream HEAD must match to release."
	false
fi

PREVIOUS_TAG=$(git describe --tags --abbrev=0 2> /dev/null || true)
CURRENT_TAG=$(git describe --tags --exact-match 2> /dev/null || true)

if [ $CURRENT_TAG ]
then
	echo >&2 "ERROR: Cannot release HEAD, it is already tagged $CURRENT_TAG"
	false
fi

if [ $2 ]
then
	RELEASE_TAG=$2
else
	RELEASE_TAG=$(echo $PREVIOUS_TAG | awk -F'.' '{ print $1"."$2"."$3+1 }')
fi

if [ ! $(echo $RELEASE_TAG | grep '^v[0-9]\+\.[0-9]\+\.[0-9]\+$') ]
then
	echo >&2 "ERROR: Release tag must match format 'vDIGIT.DIGIT.DIGIT'"
	false
fi

read -p "About to release version $RELEASE_TAG, press enter to continue " Z

RESPONSE=`curl https://api.github.com/repos/periodo/periodo-client/releases \
	-sS \
	-XPOST \
	-H "Authorization: token $(cat $GITHUB_TOKEN)" \
	-H "Content-type: application/json" \
	-d "{\
		\"tag_name\": \"$RELEASE_TAG\",\
		\"target_commitish\": \"master\",\
		\"name\": \"$RELEASE_TAG\"\
	}"`

ASSET_URL=$(
	echo $RESPONSE \
	| grep -o '"upload_url": "[^"]\+' \
	| cut -c 16- \
	| sed -e "s/{?name}/?name=periodo-client-bundle-$RELEASE_TAG.zip/")

curl $ASSET_URL \
	-sS \
	-XPOST \
	-H "Authorization: token $(cat $GITHUB_TOKEN)" \
	-H "Content-type: application/zip" \
	--data-binary @$RELEASE_ZIP
