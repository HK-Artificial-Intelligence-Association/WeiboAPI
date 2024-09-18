#!/bin/bash

PACKAGE_VERSION=$(node -p "require('./package.json').version")
echo "::set-output name=version::$PACKAGE_VERSION"