###############
#  Variables  #
###############

PROJECT_NAME = periodo

NPM_BIN = node_modules/.bin

BROWSERIFY_ENTRY = modules/periodo-app/src/index.js

VERSION := $(shell grep version modules/periodo-app/package.json | cut -d \" -f 4)

JS_BUNDLE := dist/$(PROJECT_NAME).js
VERSIONED_JS_BUNDLE := $(JS_BUNDLE:.js=-$(VERSION).js)
MINIFIED_VERSIONED_JS_BUNDLE := $(VERSIONED_JS_BUNDLE:.js=.min.js)

VERSIONED_DIRECTORY := $(PROJECT_NAME)-$(VERSION)
VERSIONED_ZIPFILE := dist/$(VERSIONED_DIRECTORY).zip


ZIPPED_FILES := $(MINIFIED_VERSIONED_JS_BUNDLE) \
	       index.html \
	       LICENSE \
	       README.md


JS_FILES := $(shell find . -name *.js -not -path */node_modules/*)

PACKAGE_JSON_FILES := $(shell find . -name package.json -not -path */node_modules/*)


###################
#  Phony targets  #
###################

all: node_modules $(MINIFIED_VERSIONED_JS_BUNDLE)

zip: $(VERSIONED_ZIPFILE)

clean:
	rm -rf dist
	rm -rf node_modules
	lerna clean --yes

serve:
	python3 -m http.server 8020

test:
	$(NODE_PATH_PREAMBLE) npm test

watch: node_modules | dist
	$(NPM_BIN)/watchify $(BROWSERIFY_ENTRY) -o $(JS_BUNDLE) -dv


.PHONY: all zip clean serve watch test



#############
#  Targets  #
#############

dist:
	mkdir -p $@

node_modules: $(PACKAGE_JSON_FILES)
	npm install
	lerna bootstrap --hoist

$(VERSIONED_JS_BUNDLE): $(JS_FILES) | dist
	NODE_ENV=production $(NPM_BIN)/browserify -d $(BROWSERIFY_ENTRY) -o $@

$(MINIFIED_VERSIONED_JS_BUNDLE): $(VERSIONED_JS_BUNDLE)
	$(NPM_BIN)/babili $< -o $@


$(VERSIONED_ZIPFILE): $(ZIPPED_FILES) | dist
	mkdir $(VERSIONED_DIRECTORY)
	cp $^ $(VERSIONED_DIRECTORY)
	sed -i \
		-e "s|$(JS_BUNDLE)|$(MINIFIED_VERSIONED_JS_BUNDLE)|" \
		$(VERSIONED_DIRECTORY)/index.html
	zip -r $@ $(VERSIONED_DIRECTORY)
	rm -rf $(VERSIONED_DIRECTORY)
