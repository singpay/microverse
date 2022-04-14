#!/bin/sh

DIST=${1}

if [ -z ${DIST} ]
then
    echo "specify the destination dir"
    exit 1;
fi

cat dist/index.html | sed  's:<script.*index.*\.js.*<\/script>:<script defer src="lib/index.js"><\/script>:' > ${DIST}/index.html
mv  ${DIST}/lib/index-*.js ${DIST}/lib/index.js
