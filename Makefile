JS_BASE_NAME := $(shell jq -r '.name' package.json)
VERSION := $(shell jq -r '.version' package.json)
ENTRY := modules/periodo-app/src/index.js

BIN := node_modules/.bin

DEVELOPMENT_JS_BUNDLE := $(JS_BASE_NAME).js
PRODUCTION_JS_BUNDLE := $(subst .js,-$(VERSION).min.js,$(DEVELOPMENT_JS_BUNDLE))

JS_FILES := $(shell find modules -name '*.js' -not -path */node_modules/*)
PACKAGE_JSON_FILES := $(shell find . -name package.json -not -path */node_modules/*)

production: $(PRODUCTION_JS_BUNDLE)
	sed -e 's/JS-FILENAME/$</' index.TEMPLATE.html > index.html

watch: node_modules
	sed -e 's/JS-FILENAME/$(DEVELOPMENT_JS_BUNDLE)/' index.TEMPLATE.html > index.html
	$(BIN)/watchify $(ENTRY) -o $(DEVELOPMENT_JS_BUNDLE) -dv

test:
	npm test

node_modules: $(PACKAGE_JSON_FILES)
	npm install
	$(BIN)/lerna bootstrap --hoist

$(PRODUCTION_JS_BUNDLE): $(JS_FILES) node_modules
	NODE_ENV=production $(BIN)/browserify -d $(ENTRY) -o $(subst .min,,$@)
	$(BIN)/minify $(subst .min,,$@) -o $@

clean:
	rm -f index.html $(JS_BASE_NAME)*.js
	test -f $(BIN)/lerna && $(BIN)/lerna clean --yes || exit 0
	rm -rf node_modules

.PHONY: production watch test clean
