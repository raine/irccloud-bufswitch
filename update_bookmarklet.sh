#!/usr/bin/env bash

./bookmarklet.js > tmp/bookmarklet.html
git checkout gh-pages
cp tmp/bookmarklet.html .
git add bookmarklet.html
git commit -m 'update bookmarklet'
git push
git checkout master
