PROJECT_NAME = periodo

BROWSERIFY = node_modules/.bin/browserify
WATCHIFY = node_modules/.bin/watchify
BABILI = node_modules/.bin/babili
LERNA = node_modules/.bin/lerna

BROWSERIFY_ENTRY = modules/periodo-app/src/index.js

VERSION := $(shell grep version modules/periodo-app/package.json | cut -d \" -f 4)

JS_BUNDLE := dist/$(PROJECT_NAME).js
VERSIONED_JS_BUNDLE := $(JS_BUNDLE:.js=-$(VERSION).js)
MINIFIED_VERSIONED_JS_BUNDLE := $(VERSIONED_JS_BUNDLE:.js=.min.js)

VERSIONED_DIRECTORY := $(PROJECT_NAME)-$(VERSION)
VERSIONED_ZIPFILE := dist/$(VERSIONED_DIRECTORY).zip
ZIPFILE_JS_SOURCE := $(subst dist/,,$(VERSIONED_JS_BUNDLE))

IMAGES := $(shell find images -type f)

ZIPPED_FILES := \
	$(VERSIONED_JS_BUNDLE) \
	$(MINIFIED_VERSIONED_JS_BUNDLE) \
	index.html \
	LICENSE \
	README.md

JS_FILES := $(shell find modules -name *.js -not -path */node_modules/*)

PACKAGE_JSON_FILES := $(shell find . -name package.json -not -path */node_modules/*)


# Main functions

zip: $(VERSIONED_ZIPFILE)

release: $(VERSIONED_ZIPFILE)
	./bin/release.js

watch: node_modules | dist
	$(WATCHIFY) $(BROWSERIFY_ENTRY) -o $(JS_BUNDLE) -dv
serve:
	python3 -m http.server 8020

test:
	npm test



# The rest of em

dist:
	mkdir -p $@

node_modules: $(PACKAGE_JSON_FILES)
	npm install
	$(LERNA) bootstrap --hoist

$(VERSIONED_JS_BUNDLE): $(JS_FILES) node_modules | dist
	NODE_ENV=production $(BROWSERIFY) -d $(BROWSERIFY_ENTRY) -o $@

$(MINIFIED_VERSIONED_JS_BUNDLE): $(VERSIONED_JS_BUNDLE)
	$(BABILI) $< -o $@

$(VERSIONED_ZIPFILE): $(ZIPPED_FILES)
	mkdir $(VERSIONED_DIRECTORY)
	cp $^ $(VERSIONED_DIRECTORY)
	mkdir $(VERSIONED_DIRECTORY)/images
	cp $(IMAGES) $(VERSIONED_DIRECTORY)/images
	sed -i -e "s|$(JS_BUNDLE)|$(ZIPFILE_JS_SOURCE)|" $(VERSIONED_DIRECTORY)/index.html
	zip -r $@ $(VERSIONED_DIRECTORY)
	rm -rf $(VERSIONED_DIRECTORY)

clean:
	rm -rf dist
	$(LERNA) clean --yes
	rm -rf node_modules



.PHONY: zip release watch serve test clean
