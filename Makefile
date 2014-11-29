NPMBIN=./node_modules/.bin
BROWSERIFY_OPTS=-d -o dist/periodo.js src/app.js
LESSC_OPTS=style.less dist/periodo.css
WATCH_LESSC_OPTS=-i style.less -o dist/periodo.css

all: setup bundle

setup:
	mkdir -p dist
	npm install

bundle:
	$(NPMBIN)/browserify $(BROWSERIFY_OPTS)
	$(NPMBIN)/lessc $(LESSC_OPTS)

watch:
	$(NPMBIN)/watchify -v $(BROWSERIFY_OPTS) &
	$(NPMBIN)/watch-lessc $(WATCH_LESSC_OPTS)

serve:
	python3 -m http.server
