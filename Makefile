###########

NPM_BIN = ./node_modules/.bin
DIST_DIR = dist
VERSION_STR = $(shell grep -oP '(?<="version": ")[^"]+' package.json)


CSS_BUNDLE = $(DIST_DIR)/periodo.css
CSS_BUNDLE_VERSIONED = $(subst .css,-$(VERSION_STR).css,$(CSS_BUNDLE))

JS_BUNDLE = $(DIST_DIR)/periodo.js
JS_BUNDLE_VERSIONED = $(subst .js,-$(VERSION_STR).js,$(JS_BUNDLE))
JS_VERSIONED_SOURCE_MAP = $(DIST_DIR)/periodo.map
JS_MINIFIED_BUNDLE = $(DIST_DIR)/periodo.min.js
JS_MINIFIED_SOURCE_MAP = $(DIST_DIR)/periodo.min.map
JS_MINIFIED_BUNDLE_VERSIONED = $(subst .min.js,-$(VERSION_STR).min.js,$(JS_MINIFIED_BUNDLE))
JS_MINIFIED_VERSIONED_SOURCE_MAP = $(subst .min.map,-$(VERSION_STR).min.map,$(JS_MINIFIED_SOURCE_MAP))

ZIP_FILE = $(DIST_DIR)/periodo-$(VERSION_STR).zip


JS_ENTRY = src/app.js
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
	./release.sh $(ZIP_FILE) v$(VERSION_STR)

.PHONY: bundle clean watch zip


$(DIST_DIR):
	@mkdir -p $(DIST_DIR)

$(ZIP_FILE): $(JS_BUNDLE_VERSIONED) $(JS_MINIFIED_BUNDLE_VERSIONED) $(JS_MINIFIED_VERSIONED_SOURCE_MAP) $(CSS_BUNDLE_VERSIONED) $(LIB_FILES) LICENSE COPYING favicon.ico
	@rm -f $@
	cp index.html dist/index.html
	sed -i \
		-e 's|$(JS_BUNDLE)|$(JS_MINIFIED_BUNDLE_VERSIONED)|' \
		-e 's|$(CSS_BUNDLE)|$(CSS_BUNDLE_VERSIONED)|' \
		dist/index.html
	zip $@ $^
	zip -j $@ dist/index.html
	rm dist/index.html

$(JS_BUNDLE): $(DIST_DIR) $(SRC_FILES)
	$(NPM_BIN)/browserify -d -o $@ src/app.js

$(JS_BUNDLE_VERSIONED): $(DIST_DIR) $(SRC_FILES)
	$(NPM_BIN)/browserify -d src/app.js | $(NPM_BIN)/exorcist $(JS_VERSIONED_SOURCE_MAP) --url $(subst dist/,,$(JS_VERSIONED_SOURCE_MAP)) > $@

$(JS_MINIFIED_BUNDLE): $(JS_BUNDLE)
	$(NPM_BIN)/uglifyjs $< --source-map $(JS_MINIFIED_SOURCE_MAP) --source-map-url $(subst dist/,,$(JS_MINIFIED_SOURCE_MAP)) -c warnings=false -m -o $@

$(JS_MINIFIED_BUNDLE_VERSIONED): $(JS_BUNDLE_VERSIONED)
	$(NPM_BIN)/uglifyjs $< --in-source-map $(JS_VERSIONED_SOURCE_MAP) --source-map $(JS_MINIFIED_VERSIONED_SOURCE_MAP) --source-map-url $(subst dist/,,$(JS_MINIFIED_VERSIONED_SOURCE_MAP)) -c warnings=false -m -o $@

$(CSS_BUNDLE): $(DIST_DIR) style.less
	$(NPM_BIN)/lessc style.less $@

$(CSS_BUNDLE_VERSIONED): $(CSS_BUNDLE)
	cp $< $@
