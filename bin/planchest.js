#!/usr/bin/env node
// Node 23.6+ runs TypeScript directly (type stripping), so there is no
// build step: the plugin works straight from a git checkout.
import "../src/cli.ts";
