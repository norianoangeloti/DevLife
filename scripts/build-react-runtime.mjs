import {buildSync} from 'esbuild';
buildSync({stdin:{contents:'import React from "react"; import {createRoot} from "react-dom/client";window.React=React;window.createRoot=createRoot;',resolveDir:process.cwd()},bundle:true,minify:true,format:'iife',define:{'process.env.NODE_ENV':'"production"'},outfile:'public/vendor/react-runtime.js'});
console.log('Runtime React gerado.');
