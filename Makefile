###############
#  Variables  #
###############

PROJECT_NAME := periodo-client

NPM_BIN := node_modules/.bin

VERSION := $(shell git describe --abbrev=0 | cut -c 2-)

JS_BUNDLE := $(PROJECT_NAME).js

VERSIONED_DIRECTORY := dist/$(PROJECT_NAME)-$(VERSION)
VERSIONED_JS_BUNDLE := $(VERSIONED_DIRECTORY).js
MINIFIED_VERSIONED_JS_BUNDLE = $(VERSIONED_DIRECTORY).min.js
VERSIONED_ZIPFILE := $(VERSIONED_DIRECTORY).zip

BROWSERIFY_ENTRY = modules/periodo-app/src/index.js

JS_FILES := $(shell find modules/ -type f -name '*js' -not -path '*/node_modules/*')
ASSET_FILES := $(shell find images/ -type f)
PACKAGE_JSON_FILES := $(shell find . -name package.json -not -path '*/node_modules/*')

ZIPPED_FILES = $(VERSIONED_JS_BUNDLE) \
	       $(MINIFIED_VERSIONED_JS_BUNDLE) \
	       $(ASSET_FILES) \
	       favicon.ico \
	       index.html \
	       COPYING \
	       LICENSE \
	       LICENSE-3RD-PARTY


###################
#  Phony targets  #
###################

all: zip

watch: node_modules | dist
	$(BROWSERIFY_PREAMBLE) $(NPM_BIN)/watchify -v -d -o $(JS_BUNDLE) $(BROWSERIFY_ENTRY)

zip: $(VERSIONED_ZIPFILE)

test:
	npm test

clean:
	test -f $(BIN)/lerna && $(BIN)/lerna clean --yes || exit 0
	rm -rf node_modules
	rm -rf dist

publish: clean zip
	unzip $(VERSIONED_ZIPFILE) -d dist
	cd $(VERSIONED_DIRECTORY) && npm publish

.PHONY: all watch zip serve test clean


#############
#  Targets  #
#############

dist:
	mkdir -p $@

node_modules: package.json
	npm install || rm -rf $@
	$(NPM_BIN)/lerna bootstrap --hoist || rm -rf $@

$(VERSIONED_JS_BUNDLE): node_modules $(JS_FILES) | dist
	$(BROWSERIFY_PREAMBLE) NODE_ENV=production $(NPM_BIN)/browserify -d $(BROWSERIFY_ENTRY) -o $@

$(MINIFIED_VERSIONED_JS_BUNDLE): $(VERSIONED_JS_BUNDLE)
	$(NPM_BIN)/terser $< -o $@ --compress

$(VERSIONED_DIRECTORY)/package.json: package.json
	jq '{ name, version, author, contributors, license, description }' $< > $@

$(VERSIONED_ZIPFILE): $(ZIPPED_FILES) | dist
	rm -f $@
	mkdir -p $(VERSIONED_DIRECTORY)
	cp $^ $(VERSIONED_DIRECTORY)
	cd $(VERSIONED_DIRECTORY) && mkdir images && mv $(notdir $(ASSET_FILES)) images
	jq '{ name, version, author, contributors, license, description, repository, bugs }' package.json > $(VERSIONED_DIRECTORY)/package.json
	sed -i \
		-e 's|$(JS_BUNDLE)|$(notdir $(MINIFIED_VERSIONED_JS_BUNDLE))|' \
		$(VERSIONED_DIRECTORY)/index.html
	cd dist && zip -r $(notdir $@) $(notdir $(VERSIONED_DIRECTORY))
	rm -rf $(VERSIONED_DIRECTORY)
