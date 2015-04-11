###########

NPM_BIN = ./node_modules/.bin/
DIST_DIR = dist

CSS_BUNDLE = $(DIST_DIR)/periodo.css
JS_ENTRY = src/app.js
JS_BUNDLE = $(DIST_DIR)/periodo.js
JS_MINIFIED_BUNDLE = $(DIST_DIR)/periodo.min.js
ZIP_FILE = $(DIST_DIR)/periodo.zip

SRC_FILES = $(shell find ./src -type f)
LIB_FILES = $(shell find ./lib -type f)

###########

bundle: node_modules $(JS_BUNDLE) $(CSS_BUNDLE)

node_modules: package.json
	npm install

zip: $(ZIP_FILE)

clean:
	@rm -rf dist

watch: $(DIST_DIR) $(CSS_BUNDLE)
	$(NPM_BIN)/watchify -v -d -o $(JS_BUNDLE) src/app.js &
	$(NPM_BIN)/watch-lessc -i style.less -o $(CSS_BUNDLE)

GITHUB_TOKEN = ~/.githubtoken
release: $(ZIP_FILE)
	./release.sh $(ZIP_FILE)

.PHONY: bundle clean watch zip


$(DIST_DIR):
	@mkdir -p $(DIST_DIR)

$(ZIP_FILE): $(JS_BUNDLE) $(CSS_BUNDLE) $(LIB_FILES) LICENSE COPYING favicon.ico index.html
	@rm -f $@
	zip $@ $^

$(JS_BUNDLE): $(DIST_DIR) $(SRC_FILES)
	$(NPM_BIN)/browserify -o $@ src/app.js

$(JS_MINIFIED_BUNDLE): $(JS_BUNDLE)
	$(NPM_BIN)/uglifyjs $^ -c warnings=false -m -o $@

$(CSS_BUNDLE): $(DIST_DIR) style.less
	$(NPM_BIN)/lessc style.less $@
