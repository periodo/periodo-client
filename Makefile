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

DATE_PARSER := modules/periodo-date-parser/parser.js
JS_FILES := $(shell find modules -type f -name '*js' -not -path '*/node_modules/*') $(DATE_PARSER)
ASSET_FILES := $(shell find images -type f)
PACKAGE_JSON_FILES := $(shell find . -name package.json -not -path '*/node_modules/*')

ZIPPED_FILES = $(VERSIONED_JS_BUNDLE) \
	       $(MINIFIED_VERSIONED_JS_BUNDLE) \
	       $(ASSET_FILES) \
	       favicon.ico \
	       index.html \
	       COPYING \
	       LICENSE \
	       LICENSE-3RD-PARTY

MKCERT_U := https://github.com/FiloSottile/mkcert/releases/download/
MKCERT_V := v1.4.1
OS := $(shell uname | tr '[:upper:]' '[:lower:]')

###################
#  Phony targets  #
###################

stage: APP_CONFIG = fly.stage.toml
stage: DATA_HOST = data.staging.perio.do
stage: CORSPROXY_HOST = corsproxy.staging.perio.do

publish: APP_CONFIG = fly.publish.toml
publish: DATA_HOST = data.perio.do
publish: CORSPROXY_HOST = corsproxy.perio.do

stage publish: clean $(VERSIONED_DIRECTORY)
	fly deploy \
	--config $(APP_CONFIG) \
	--build-arg CLIENT_VERSION=$(VERSION)

$(JS_BUNDLE):  node_modules $(LINKED_MODULE_SYMLINKS) $(DATE_PARSER) | dist
	$(BROWSERIFY_PREAMBLE) $(NPM_BIN)/browserify -d -o $(JS_BUNDLE) $(BROWSERIFY_ENTRY)

watch: node_modules $(LINKED_MODULE_SYMLINKS) $(DATE_PARSER) | dist
	$(BROWSERIFY_PREAMBLE) $(NPM_BIN)/watchify -v -d -o $(JS_BUNDLE) $(BROWSERIFY_ENTRY)

test: node_modules $(LINKED_MODULE_SYMLINKS) $(DATE_PARSER)
	npm test

clean:
	rm -rf node_modules
	rm -rf dist
	rm -f $(DATE_PARSER)
	rm -f $(JS_BUNDLE)

update_package_lock:
	rm -rf node_modules package-lock.json
	npm install

serve: $(JS_BUNDLE)
	python3 -m http.server 5002 --bind 127.0.0.1

serve_ssl: $(JS_BUNDLE) localhost+2.pem localhost+2-key.pem
	python3 ssl-server.py

start: $(JS_BUNDLE)
	mkdir -p run
	python3 -m http.server 5002 --bind 127.0.0.1 \
	2> run/http.server.log \
	& echo $$! > run/http.server.pid

stop:
	if [ -e run/http.server.pid ]; then \
	kill $$(cat run/http.server.pid) || true; \
	rm -f run/http.server.pid; \
	fi

.PHONY: all watch serve serve_ssl start stop test clean stage publish


#############
#  Targets  #
#############

dist:
	mkdir -p $@

node_modules: package.json
	npm ci || rm -rf $@

node_modules/%: modules/%
	ln -s ../$< $@

$(DATE_PARSER): modules/periodo-date-parser/grammar.pegjs node_modules
	export PATH=$$PATH:$$PWD/$(NPM_BIN); cd modules/periodo-date-parser && npm run compile

$(VERSIONED_JS_BUNDLE): node_modules $(LINKED_MODULE_SYMLINKS) $(JS_FILES) | dist
	$(BROWSERIFY_PREAMBLE) NODE_ENV=production $(NPM_BIN)/browserify -d $(BROWSERIFY_ENTRY) -o $@

$(MINIFIED_VERSIONED_JS_BUNDLE): $(VERSIONED_JS_BUNDLE)
	$(NPM_BIN)/terser $< -o $@ --compress --keep-fnames

$(VERSIONED_DIRECTORY): $(VERSIONED_ZIPFILE)
	unzip $(VERSIONED_ZIPFILE) -d dist

$(VERSIONED_ZIPFILE): $(ZIPPED_FILES) | dist
	rm -rf $@ $(VERSIONED_DIRECTORY)
	mkdir $(VERSIONED_DIRECTORY)
	rsync -R $^ $(VERSIONED_DIRECTORY)
	rsync -r $(VERSIONED_DIRECTORY)/dist/ $(VERSIONED_DIRECTORY)
	rm -rf $(VERSIONED_DIRECTORY)/dist
	jq '{ name, version, author, contributors, license, description, repository, bugs }' package.json > $(VERSIONED_DIRECTORY)/package.json
	cp $(VERSIONED_DIRECTORY)/index.html $(VERSIONED_DIRECTORY)/index.dev.html
	sed -E -i .bak \
	-e 's|$(JS_BUNDLE)|$(notdir $(MINIFIED_VERSIONED_JS_BUNDLE))|' \
	-e 's;<link rel="(preconnect|dns-prefetch)" href="[^"]*">;<link rel="\1" href="https://$(DATA_HOST)">;' \
	-e "s;PERIODO_SERVER_URL = '[^']*';PERIODO_SERVER_URL = 'https://$(DATA_HOST)/';" \
	-e "s;PERIODO_PROXY_URL = '[^']*';PERIODO_PROXY_URL = 'https://$(CORSPROXY_HOST)/';" \
	$(VERSIONED_DIRECTORY)/index.html
	sed -E -i .bak \
	-e 's|$(JS_BUNDLE)|$(notdir $(VERSIONED_JS_BUNDLE))|' \
	-e 's;<link rel="(preconnect|dns-prefetch)" href="[^"]*">;<link rel="\1" href="https://$(DATA_HOST)">;' \
	-e "s;PERIODO_SERVER_URL = '[^']*';PERIODO_SERVER_URL = 'https://$(DATA_HOST)/';" \
	-e "s;PERIODO_PROXY_URL = '[^']*';PERIODO_PROXY_URL = 'https://$(CORSPROXY_HOST)/';" \
	$(VERSIONED_DIRECTORY)/index.dev.html
	cd dist && zip -r $(notdir $@) $(notdir $(VERSIONED_DIRECTORY))
	rm -rf $(VERSIONED_DIRECTORY)

mkcert:
	wget $(MKCERT_U)$(MKCERT_V)/mkcert-$(MKCERT_V)-$(OS)-amd64 -O mkcert
	chmod +x mkcert

localhost+2.pem localhost+2-key.pem: mkcert
	./mkcert -install
	./mkcert localhost 127.0.0.1 ::1
