###############
#  Variables  #
###############

PROJECT_NAME := periodo-client

NPM_BIN := node_modules/.bin

VERSION := $(shell git describe | cut -c 2-)

JS_BUNDLE := $(PROJECT_NAME).js

VERSIONED_DIRECTORY := dist/$(PROJECT_NAME)-$(VERSION)
VERSIONED_JS_BUNDLE := $(VERSIONED_DIRECTORY).js
MINIFIED_VERSIONED_JS_BUNDLE = $(VERSIONED_DIRECTORY).min.js
VERSIONED_ZIPFILE := $(VERSIONED_DIRECTORY).zip
PKG := $(VERSIONED_DIRECTORY)/$(PROJECT_NAME)-$(VERSION).tgz

BROWSERIFY_ENTRY = modules/periodo-app/src/index.js

LINKED_MODULES := $(wildcard modules/*)
LINKED_MODULE_SYMLINKS := $(subst modules/,node_modules/,$(LINKED_MODULES))

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

all: $(VERSIONED_ZIPFILE)

watch: node_modules $(LINKED_MODULE_SYMLINKS) | dist
	$(BROWSERIFY_PREAMBLE) $(NPM_BIN)/watchify -v -d -o $(JS_BUNDLE) $(BROWSERIFY_ENTRY)

test: node_modules $(LINKED_MODULE_SYMLINKS)
	npm test

clean:
	rm -rf node_modules
	rm -rf dist

stage: HOST = data.staging.perio.do
publish: HOST = data.perio.do
stage publish: clean upload

upload: DIR = /var/www/$(HOST)/client_packages/
upload: $(PKG) $(PKG).sha256
	rsync -vuh -e ssh $^ $(HOST):$(DIR)
	ssh $(HOST) ln -f $(DIR)$(PROJECT_NAME)-$(VERSION).tgz $(DIR)$(PROJECT_NAME)-latest.tgz
	ssh $(HOST) "sed 's/$(VERSION)/latest/' $(DIR)$(PROJECT_NAME)-$(VERSION).tgz.sha256 > $(DIR)$(PROJECT_NAME)-latest.tgz.sha256"

serve:
	python3 -m http.server 5002

.PHONY: all watch serve test clean upload stage publish


#############
#  Targets  #
#############

dist:
	mkdir -p $@

node_modules: package.json
	npm install || rm -rf $@

node_modules/%: modules/%
	ln -s ../$< $@

$(VERSIONED_JS_BUNDLE): node_modules $(LINKED_MODULE_SYMLINKS) $(JS_FILES) | dist
	$(BROWSERIFY_PREAMBLE) NODE_ENV=production $(NPM_BIN)/browserify -d $(BROWSERIFY_ENTRY) -o $@

$(MINIFIED_VERSIONED_JS_BUNDLE): $(VERSIONED_JS_BUNDLE)
	$(NPM_BIN)/terser $< -o $@ --compress --keep-fnames

$(VERSIONED_DIRECTORY): $(VERSIONED_ZIPFILE)
	unzip $(VERSIONED_ZIPFILE) -d dist

$(VERSIONED_DIRECTORY)/package.json: package.json
	jq '{ name, version, author, contributors, license, description }' $< > $@

$(PKG): $(VERSIONED_DIRECTORY)
	cd $< && npm pack
	cp $</periodo-client-*.tgz $(PKG)

$(PKG).sha256: $(PKG)
	sha256sum $< | sed "s/dist\/$(PROJECT_NAME)-$(VERSION)\///" > $@

$(VERSIONED_ZIPFILE): $(ZIPPED_FILES) | dist
	rm -rf $@ $(VERSIONED_DIRECTORY)
	mkdir $(VERSIONED_DIRECTORY)
	rsync -R $^ $(VERSIONED_DIRECTORY)
	rsync -r $(VERSIONED_DIRECTORY)/dist/ $(VERSIONED_DIRECTORY)
	rm -rf $(VERSIONED_DIRECTORY)/dist
	jq '{ name, version, author, contributors, license, description, repository, bugs }' package.json > $(VERSIONED_DIRECTORY)/package.json
	cp $(VERSIONED_DIRECTORY)/index.html $(VERSIONED_DIRECTORY)/index.dev.html
	sed -i \
		-e 's|$(JS_BUNDLE)|$(notdir $(MINIFIED_VERSIONED_JS_BUNDLE))|' \
		$(VERSIONED_DIRECTORY)/index.html
	sed -i \
		-e 's|$(JS_BUNDLE)|$(notdir $(VERSIONED_JS_BUNDLE))|' \
		$(VERSIONED_DIRECTORY)/index.dev.html
	cd dist && zip -r $(notdir $@) $(notdir $(VERSIONED_DIRECTORY))
	rm -rf $(VERSIONED_DIRECTORY)
