#!/usr/bin/env node

import { Command } from "commander";
import { startCommand } from "../src/commands/start.js";

const program = new Command();

program.name("interview-coach").description("AI Interview Coach");

program.command("start").description("Start interview").action(startCommand);

program.parse();
