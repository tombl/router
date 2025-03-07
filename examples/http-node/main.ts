#!/usr/bin/env -S node --no-warnings --experimental-strip-types
import { createRequestListener } from "@mjackson/node-fetch-server";
import * as http from "node:http";
import router from "../http.ts";

const server = http.createServer(createRequestListener(router.fetch));

server.listen(3000, () => {
  console.log("Listening on http://localhost:3000");
});
