NPMBIN=./node_modules/.bin
BROWSERIFY_OPTS=-d -o dist/periodo.js src/app.js

all: setup bundle

setup:
	mkdir -p dist
	npm install

bundle:
	$(NPMBIN)/browserify $(BROWSERIFY_OPTS)

watch:
	$(NPMBIN)/watchify -v $(BROWSERIFY_OPTS) 

serve:
	python3 -m http.server
