###############
#  Variables  #
###############

PROJECT_NAME = periodo

NPM_BIN = node_modules/.bin

BROWSERIFY_ENTRY = src/index.js
CSS_ENTRY = style/main.css

VERSION := $(shell npm ls --depth=0 --long 2> /dev/null | head -n 1 | cut -d@ -f 2)

JS_BUNDLE = dist/$(PROJECT_NAME).js
VERSIONED_JS_BUNDLE = $(JS_BUNDLE:.js=-$(VERSION).js)
MINIFIED_VERSIONED_JS_BUNDLE = $(VERSIONED_JS_BUNDLE:.js=.min.js)

CSS_BUNDLE = $(JS_BUNDLE:.js=.css)
VERSIONED_CSS_BUNDLE = $(VERSIONED_JS_BUNDLE:.js=.css)
MINIFIED_VERSIONED_CSS_BUNDLE = $(MINIFIED_VERSIONED_JS_BUNDLE:.js=.css)


VERSIONED_DIRECTORY = $(PROJECT_NAME)-$(VERSION)
VERSIONED_ZIPFILE = dist/$(VERSIONED_DIRECTORY).zip


ZIPPED_FILES = $(MINIFIED_VERSIONED_JS_BUNDLE) \
	       $(MINIFIED_VERSIONED_CSS_BUNDLE) \
	       index.html \
	       LICENSE \
	       README.md


POSTCSS_OPTS = --use postcss-import \
	       --use postcss-cssnext

JS_FILES = $(shell find src/ -type f -name *js -o -name *jsx)
CSS_FILES = $(shell find style/ -type f -name *css)


###################
#  Phony targets  #
###################

all: node_modules $(MINIFIED_VERSIONED_JS_BUNDLE) $(VERSIONED_CSS_BUNDLE)

zip: $(VERSIONED_ZIPFILE)

clean:
	@rm -rf dist

watch: node_modules | dist
	$(NPM_BIN)/postcss $(POSTCSS_OPTS) $(CSS_ENTRY) -o $(CSS_BUNDLE)
	$(NPM_BIN)/watchify $(BROWSERIFY_ENTRY) -o $(JS_BUNDLE) -dv


GITHUB_TOKEN = ~/.githubtoken
release: $(ZIP_FILE)
	./release.sh $(ZIP_FILE) v$(VERSION_STR)

.PHONY: all zip clean wawtch release


#############
#  Targets  #
#############

dist:
	mkdir -p $@

node_modules: package.json
	npm install

$(VERSIONED_JS_BUNDLE): $(JS_FILES) | dist
	NODE_ENV=production $(NPM_BIN)/browserify -d $(BROWSERIFY_ENTRY) -o $@

$(MINIFIED_VERSIONED_JS_BUNDLE): $(VERSIONED_JS_BUNDLE)
	$(NPM_BIN)/uglifyjs $< -c warnings=false -o $@


$(VERSIONED_CSS_BUNDLE): $(CSS_FILES) | dist
	$(NPM_BIN)/postcss $(POSTCSS_OPTS) $(CSS_ENTRY) -o $@

$(VERSIONED_ZIPFILE): $(ZIPPED_FILES) | dist
	mkdir $(VERSIONED_DIRECTORY)
	cp $^ $(VERSIONED_DIRECTORY)
	sed -i \
		-e "s|$(JS_BUNDLE)|$(MINIFIED_VERSIONED_JS_BUNDLE)|" \
		-e "s|$(CSS_BUNDLE)|$(VERSIONED_CSS_BUNDLE)|" \
		$(VERSIONED_DIRECTORY)/index.html
	zip -r $@ $(VERSIONED_DIRECTORY)
	rm -rf $(VERSIONED_DIRECTORY)
