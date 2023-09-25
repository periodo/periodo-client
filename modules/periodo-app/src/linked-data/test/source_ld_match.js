"use strict";

const test = require('blue-tape')
    , { match, asURL } = require('../utils/source_ld_match')

test('Parsing WorldCat URLs', async t => {

  t.equal(asURL(match("http://worldcat.org/oclc/228741004")), "http://experiment.worldcat.org/oclc/228741004.ttl")
  t.equal(asURL(match("http://www.worldcat.org/oclc/228741004")), "http://experiment.worldcat.org/oclc/228741004.ttl")
  t.equal(asURL(match("https://worldcat.org/en/title/228741004")), "http://experiment.worldcat.org/oclc/228741004.ttl")
  t.equal(asURL(match("https://worldcat.org/ja/title/228741004")), "http://experiment.worldcat.org/oclc/228741004.ttl")
  t.equal(asURL(match("https://worldcat.org/oclc/228741004")), "http://experiment.worldcat.org/oclc/228741004.ttl")
  t.equal(asURL(match("https://worldcat.org/title/228741004")), "http://experiment.worldcat.org/oclc/228741004.ttl")
  t.equal(asURL(match("https://www.worldcat.org/oclc/228741004")), "http://experiment.worldcat.org/oclc/228741004.ttl")
})
